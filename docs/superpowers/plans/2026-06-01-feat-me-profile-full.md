# 내 정보(프로필) 전체 영속화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** "내 정보" 화면의 기초정보·학력·자격증·경험을 실제로 저장/조회/수정/삭제할 수 있게 BE CRUD + FE 배선을 추가한다(이력서 파일은 v2).

**Architecture:** DB 테이블(`education`·`certificate`·`experience`)은 V1에 이미 존재 — 마이그레이션 없이 JPA 매핑만. 3개 CRUD는 `career` 모듈(domain→repository→service→controller→DTO, ownership 체크 + `orderIndex` 자동) 구조를 1:1 복제. 기초정보는 기존 `Profile` 엔티티에 컬럼 매핑 추가 + `PATCH /me/profile`. FE는 4개 fetch + `profile-view` 실데이터 배선.

**Tech Stack:** Spring Boot(JPA/Flyway) + JUnit5 (BE), Next.js + Vitest (FE).

**Spec:** `docs/superpowers/specs/2026-06-01-feat-me-profile-full-design.md`

**템플릿(반드시 먼저 읽기):** `backend/src/main/java/com/twochi/career/`의 `domain/Career.java`, `repository/CareerRepository.java`, `service/CareerService.java`, `controller/CareerController.java`, `dto/CareerRequest.java`, `dto/CareerResponse.java`. 각 신규 CRUD는 이 구조·관례(ownership 체크, orderIndex 자동, `@RestController` + `@RequestMapping("/api/v1/me/...")`, `BusinessException(ErrorCode.*_NOT_FOUND)`)를 그대로 따른다. BE 통합테스트는 `backend/src/test/java/com/twochi/career/CareerIntegrationTest.java` 패턴.

---

## DB 스키마 (이미 존재 — 매핑 대상)

```
education(id, user_id, level[CHECK HIGH_SCHOOL|UNIVERSITY|GRADUATE], school, major?, start_date?, end_date?,
          gpa?(NUMERIC 3,2), gpa_max?(NUMERIC 3,2), status[CHECK GRADUATED|ATTENDING|LEAVE|DROP], order_index, ts)
certificate(id, user_id, name, issuer?, acquired_at?(DATE), score?(VARCHAR), order_index, ts)
experience(id, user_id, type[CHECK INTERN|CLUB|CONTEST|VOLUNTEER|SIDE_PROJECT|OTHER], name, organization?,
           start_date?, end_date?, role?, summary?(TEXT), order_index, ts)
profile(... 기존 ..., name?(VARCHAR50), birth_date?(DATE), gender?[CHECK MALE|FEMALE|NONE], phone?(VARCHAR20),
        region?(VARCHAR50), introduction?(TEXT))  ← name/birth_date/phone/region/introduction 매핑 추가(gender v2)
```

## 엔드포인트 계약

| 리소스 | 엔드포인트 |
|---|---|
| 학력 | `GET / POST /api/v1/me/educations`, `PUT / DELETE /api/v1/me/educations/{id}` |
| 자격증 | `GET / POST /api/v1/me/certificates`, `PUT / DELETE /api/v1/me/certificates/{id}` |
| 경험 | `GET / POST /api/v1/me/experiences`, `PUT / DELETE /api/v1/me/experiences/{id}` |
| 기초정보 | `GET /api/v1/me/profile` (조회), `PATCH /api/v1/me/profile` (기초정보 수정) |

각 쓰기는 `userId` ownership. 목록은 `order_index ASC` 정렬. 생성 시 orderIndex = 현재 최대+1(career 방식). 신규 ErrorCode: `EDUCATION_NOT_FOUND`, `CERTIFICATE_NOT_FOUND`, `EXPERIENCE_NOT_FOUND` (HttpStatus.NOT_FOUND, career의 `CAREER_NOT_FOUND` 패턴).

---

## Task 1: BE 학력(Education) CRUD — canonical

**Files (career 모듈 미러):**
- Create: `backend/src/main/java/com/twochi/profile/education/domain/Education.java`
- Create: `backend/src/main/java/com/twochi/profile/education/domain/EducationLevel.java` (enum HIGH_SCHOOL/UNIVERSITY/GRADUATE)
- Create: `backend/src/main/java/com/twochi/profile/education/domain/EducationStatus.java` (enum GRADUATED/ATTENDING/LEAVE/DROP)
- Create: `backend/src/main/java/com/twochi/profile/education/repository/EducationRepository.java`
- Create: `backend/src/main/java/com/twochi/profile/education/service/EducationService.java`
- Create: `backend/src/main/java/com/twochi/profile/education/controller/EducationController.java`
- Create: `backend/src/main/java/com/twochi/profile/education/dto/EducationRequest.java` (validation)
- Create: `backend/src/main/java/com/twochi/profile/education/dto/EducationResponse.java`
- Modify: `backend/src/main/java/com/twochi/common/exception/ErrorCode.java` (+ `EDUCATION_NOT_FOUND`)
- Test: `backend/src/test/java/com/twochi/profile/EducationIntegrationTest.java`

- [ ] **Step 1: Write the failing integration test**

`EducationIntegrationTest` (career 통합테스트 패턴: `@SpringBootTest @AutoConfigureMockMvc @Transactional @ActiveProfiles("test")`, 인증은 career 테스트가 쓰는 방식 그대로 — 테스트 유저 생성 + JWT 또는 `@WithMockUser`/principal 주입 방식 확인 후 동일 적용). 케이스:
- `create_returns_201_and_persists` — POST educations(level=UNIVERSITY, school="서울대", major="컴공", status=ATTENDING) → 201 + DB 1건.
- `list_returns_orderIndex_asc` — 2건 생성 → GET 목록 order_index 오름차순.
- `update_changes_fields` — PUT {id} → 필드 반영.
- `delete_removes` — DELETE {id} → 204, 이후 목록 0건.
- `cross_user_404` — 다른 user의 id PUT/DELETE → 404.

(career 테스트의 인증 셋업·헬퍼를 그대로 복사해 적용. 정확한 인증 방식은 `CareerIntegrationTest`를 읽어 동일하게.)

- [ ] **Step 2: Run → FAIL** (`cd backend && ./gradlew test --tests "com.twochi.profile.EducationIntegrationTest"`, 컴파일 실패: 클래스 없음).

- [ ] **Step 3: 구현 — Education 도메인/CRUD (career 미러)**

`Education.java`: `@Entity @Table(name="education")`, 필드 `id(IDENTITY), userId, level(@Enumerated STRING), school, major, startDate, endDate, gpa(BigDecimal), gpaMax(BigDecimal), status(@Enumerated STRING), orderIndex, createdAt, updatedAt`. `Career`처럼 `static create(...)` 팩토리 + `update(...)` 메서드 + 보호 생성자.
`EducationLevel`/`EducationStatus` enum은 DDL CHECK 값과 정확히 일치.
`EducationRepository extends JpaRepository<Education, Long>`: `List<Education> findByUserIdOrderByOrderIndexAsc(Long userId)`, `Optional<Education> findByIdAndUserId(Long id, Long userId)`, `int countByUserId(Long userId)` 또는 max orderIndex 조회(career 방식).
`EducationService`: create/list/update/delete, 모든 쓰기 ownership 체크(`findByIdAndUserId().orElseThrow(() -> new BusinessException(ErrorCode.EDUCATION_NOT_FOUND))`), orderIndex 자동.
`EducationController`: `@RestController @RequestMapping("/api/v1/me/educations")`, 인증 principal에서 userId 추출(career 컨트롤러와 동일 방식). GET/POST/PUT{id}/DELETE{id}.
`EducationRequest`(jakarta validation: school @NotBlank, level/status @NotNull), `EducationResponse`(전 필드 + id).
`ErrorCode.java`에 `EDUCATION_NOT_FOUND(HttpStatus.NOT_FOUND, "학력 정보를 찾을 수 없어요.")` 추가.

- [ ] **Step 4: Run → PASS** (위 명령). 

- [ ] **Step 5: Commit**
```bash
git add backend/src/main/java/com/twochi/profile/education backend/src/main/java/com/twochi/common/exception/ErrorCode.java backend/src/test/java/com/twochi/profile/EducationIntegrationTest.java
git commit -m "feat(me): 학력(Education) CRUD — 기존 education 테이블 매핑 (베타 #3)"
```

---

## Task 2: BE 자격증(Certificate) CRUD — Education 미러

**Task 1(Education)의 구조를 그대로 복제**하되 필드/이름/경로만 교체. (Education 구현을 먼저 읽고 동일 패턴 적용.)

**Files:** `backend/src/main/java/com/twochi/profile/certificate/{domain/Certificate,repository/CertificateRepository,service/CertificateService,controller/CertificateController,dto/CertificateRequest,dto/CertificateResponse}.java`, `ErrorCode`(+`CERTIFICATE_NOT_FOUND`), Test `backend/src/test/java/com/twochi/profile/CertificateIntegrationTest.java`.

**필드 델타:** `Certificate` = `id, userId, name(@NotBlank), issuer?, acquiredAt?(LocalDate), score?(String), orderIndex, ts`. enum 없음. 경로 `/api/v1/me/certificates`. ErrorCode `CERTIFICATE_NOT_FOUND(NOT_FOUND, "자격증 정보를 찾을 수 없어요.")`.

- [ ] **Step 1:** 통합테스트(create 201 / list orderIndex / update / delete / cross_user 404) — Education 테스트 미러, 필드만 교체.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** 구현 — Education 미러, 위 필드 델타 적용.
- [ ] **Step 4:** Run → PASS (`./gradlew test --tests "com.twochi.profile.CertificateIntegrationTest"`).
- [ ] **Step 5:** Commit `feat(me): 자격증(Certificate) CRUD (베타 #3)`.

---

## Task 3: BE 경험(Experience) CRUD — Education 미러 + type enum

**Task 1 구조 복제**, 필드/enum 교체.

**Files:** `backend/src/main/java/com/twochi/profile/experience/{domain/Experience,domain/ExperienceType,repository/...,service/...,controller/...,dto/ExperienceRequest,dto/ExperienceResponse}.java`, `ErrorCode`(+`EXPERIENCE_NOT_FOUND`), Test `ExperienceIntegrationTest.java`.

**필드 델타:** `Experience` = `id, userId, type(ExperienceType @Enumerated STRING @NotNull), name(@NotBlank), organization?, startDate?, endDate?, role?, summary?(TEXT), orderIndex, ts`. `ExperienceType` enum = INTERN/CLUB/CONTEST/VOLUNTEER/SIDE_PROJECT/OTHER(DDL CHECK 일치). 경로 `/api/v1/me/experiences`. ErrorCode `EXPERIENCE_NOT_FOUND(NOT_FOUND, "경험 정보를 찾을 수 없어요.")`.

- [ ] **Step 1:** 통합테스트(create 201 + type 저장 / list / update / delete / cross_user 404).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** 구현 — Education 미러 + type enum.
- [ ] **Step 4:** Run → PASS (`--tests "com.twochi.profile.ExperienceIntegrationTest"`).
- [ ] **Step 5:** Commit `feat(me): 경험(Experience) CRUD (베타 #3)`.

> **Task 1·2·3는 서로 독립(다른 패키지/파일/테이블) — worktree 격리 병렬 구현 가능.** ErrorCode.java만 공유 → 병렬 시 각자 다른 줄 추가라 충돌 거의 없으나, 병렬 머지 시 ErrorCode 수동 정합 확인.

---

## Task 4: BE 기초정보(Profile basic-info)

**Files:**
- Modify: `backend/src/main/java/com/twochi/user/domain/Profile.java` (name/birthDate/phone/region/introduction 필드 + update 메서드)
- Create: `backend/.../user/dto/ProfileBasicUpdateRequest.java`, 응답에 기초정보 포함(기존 profile 조회 DTO 확장 또는 신규 `ProfileResponse`)
- Modify/Create: profile 조회·수정 컨트롤러(기존 user/onboarding 컨트롤러 확인 후 `PATCH /api/v1/me/profile` 추가)
- Test: `backend/src/test/java/com/twochi/user/ProfileBasicInfoIntegrationTest.java`

- [ ] **Step 1:** 통합테스트 — PATCH /me/profile {name,birthDate,phone,region,introduction} → 저장 확인; GET /me/profile 반영.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** `Profile.java`에 컬럼 매핑(`@Column name`, `birth_date`(LocalDate), `phone`, `region`, `introduction`) + `updateBasic(...)` 메서드(updatedAt 갱신). 컨트롤러/서비스에 PATCH 추가(기존 profile 조회 경로 확인 후 정합). `ProfileBasicUpdateRequest` validation(전부 optional, phone 길이 등).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(me): 기초정보 편집 — PATCH /me/profile (베타 #3)`.

---

## Task 5: FE — api/types + profile-view 실데이터 배선

**Files:**
- Create: `frontend/src/lib/api/{education,certificate,experience}.ts` + 기초정보는 기존 profile api 확장(또는 `profile.ts`)
- Create: `frontend/src/lib/types/me-profile.ts` (Education/Certificate/Experience/ProfileBasic 타입 + enum 라벨 매핑: EducationLevel/Status, ExperienceType 한글)
- Modify: `frontend/src/app/(app)/me/page.tsx` (4 fetch — `Promise.all`)
- Modify: `frontend/src/components/me/profile-view.tsx` (실데이터 + 섹션별 add/edit/delete; career의 inline-edit 폼 패턴 재사용 — `frontend/src/components/me/career` 또는 해당 컴포넌트 확인)
- Remove: `frontend/src/lib/mock/me.ts`의 PROFILE_MOCK 사용처(다른 참조 확인 후)
- Test: `frontend/src/components/me/__tests__/profile-view.test.tsx`

- [ ] **Step 1:** 테스트(api mock) — profile-view가 4 리소스 실데이터 렌더 + 학력 추가 폼 제출 시 createEducation 호출 + 삭제 시 deleteEducation 호출 + 빈 상태.
- [ ] **Step 2:** Run → FAIL (`cd frontend && npm test -- profile-view`).
- [ ] **Step 3:** 구현 — api clients(`http` 사용, kanban/§9 api 패턴), types + 라벨, page.tsx Promise.all fetch, profile-view 실데이터 + inline 폼(career 패턴 재사용). 기초정보 섹션은 편집 폼 + PATCH.
- [ ] **Step 4:** Run → PASS + `npx tsc --noEmit`(신규 에러 0).
- [ ] **Step 5:** Commit `feat(me): 내 정보 실데이터 배선 + 섹션별 CRUD UI (베타 #3)`.

---

## Self-Review 결과
- **Spec coverage:** §3.1 기초정보=Task4 · §3.2 학력=Task1 · §3.3 자격증=Task2 · §3.4 경험=Task3 · §3.5 FE=Task5. 이력서=제외(v2). 마이그레이션 불필요(테이블 존재) 반영. ErrorCode 3종 추가.
- **Placeholder scan:** Task 2·3는 "Education 미러 + 필드 델타"로 기술(3개 동일 CRUD의 의도적 패턴 참조 — 각 subagent가 Task1 구현 + career 모듈을 읽어 동일 적용). Task1·4·5는 구체 필드/계약/테스트 케이스 명시. career 모듈을 canonical 참조로 지정해 "코드 전체 반복" 대신 검증된 기존 패턴 재사용.
- **Type consistency:** enum 값(EducationLevel/Status, ExperienceType)은 DDL CHECK와 일치. 엔드포인트·필드명 표/Task 본문 정합. ErrorCode 명명 `*_NOT_FOUND` 일관.
- **주의:** Task1 작성 시 `CareerIntegrationTest`의 정확한 인증 셋업을 확인해 그대로 적용(인증 방식이 plan 추정과 다르면 그 방식 채택). enum/날짜 타입은 DDL 기준.
