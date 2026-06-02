# 내 정보(프로필) 전체 영속화 설계

> 베타 차단 #3. "내 정보" 메인 화면이 정적 `PROFILE_MOCK`을 렌더하고 학력·자격증·경험의 add/edit/delete 버튼에 핸들러가 없어 **입력이 저장되지 않는다**. 온보딩은 "정리해두면 모든 화면이 자동으로 채워집니다"를 약속하지만 미이행. v1 Full 범위로 **기초정보 편집 + 학력·자격증·경험 3 CRUD**를 영속화한다(이력서 파일 업로드는 v2).

## 1. 현황 / 핵심 발견

- **FE:** `me/page.tsx`가 `PROFILE_MOCK` 렌더. `profile-view.tsx`의 5섹션(기초정보·학력·자격증·경험·이력서) 전부 display-only, add/edit/delete 핸들러 없음.
- **🎁 DB 테이블 이미 존재(V1, 미배선):** `education`·`certificate`·`experience`·`resume` 모두 컬럼·인덱스·트리거 완비, **JPA 엔티티/repo/controller만 없음**. → 마이그레이션 불필요(테이블 그대로 매핑).
  - `education`: `id, user_id, level, school, major, start_date, end_date, gpa, gpa_max, status, order_index`
  - `certificate`: `id, user_id, name, issuer, acquired_at, score, order_index`
  - `experience`: `id, user_id, type(ENUM INTERN/CLUB/CONTEST/VOLUNTEER/SIDE_PROJECT/OTHER), name, organization, start_date, end_date, role, summary, order_index`
- **프로필 기초정보:** profile 테이블(V1)에 `name, birth_date, gender, phone, region, introduction` 컬럼 예약돼 있으나 `Profile.java`는 `target/careerYear/targetJobs/onboardingCompleted`만 매핑. → 엔티티에 필드 추가 + 편집 엔드포인트만 필요(마이그레이션 불필요).
- **템플릿:** `career` 모듈(domain→repository→service→controller→DTO→FE api/types, ownership 체크, `orderIndex` 관리, inline-edit 폼)이 각 CRUD의 1:1 복제 본보기. 경력(career)은 회사 중심으로 학력/자격/경험과 **중복 없음** — 별도 유지.
- **디자인 mock:** `screen-me.jsx`의 4섹션 = 기초정보(name/birth_date/phone/region/introduction) · 학력(level/school/major/기간/status/gpa) · 자격증(name/issuer/date/score) · 경험(type/name/organization/기간/role).

## 2. 범위

**범위 안 (Full):**
- **기초정보 편집**: `Profile`에 name/birth_date/phone/region/introduction 매핑 + 편집 엔드포인트 + FE 폼.
- **학력 CRUD** (education).
- **자격증 CRUD** (certificate).
- **경험·대외활동 CRUD** (experience, type enum).
- FE `profile-view` 실 데이터 배선 + add/edit/delete(career의 inline-edit 패턴 재사용).

**범위 밖 (v2):**
- 이력서(`resume`) 파일 업로드/폼모드 — 파일 스토리지(MinIO) 연동은 v2.
- `gender` 필드(디자인 표시에 없음 — 필요 시 v2).
- 온보딩에서 학력/자격/경험 사전수집(현 온보딩 의도/경력연차/직무만 유지).

## 3. 아키텍처 / 분해

독립 sub-feature 4개. BE 3 CRUD는 career 패턴 동일 복제라 **구현 시 병렬화 가능**.

### 3.1 기초정보 (Profile basic-info)
- `Profile.java`에 `name, birthDate, phone, region, introduction` 필드 추가(기존 컬럼 매핑, nullable).
- 엔드포인트: `PATCH /api/v1/me/profile` (basic-info만; 기존 onboarding 필드와 분리). DTO: `ProfileBasicUpdateRequest` / 응답에 기초정보 포함.
- FE: 기초정보 섹션 편집 폼 + `@/lib/api` 프로필 update.

### 3.2 학력 (Education CRUD) — career 복제
- `education/domain/Education.java`(factory+update), `EducationRepository`, `EducationService`(ownership, orderIndex), `EducationController`(`GET/POST/PUT/DELETE /api/v1/me/educations`), `EducationRequest/Response` DTO.
- 필드: level, school, major, startDate, endDate, gpa, gpaMax, status, orderIndex. `level`/`status`는 enum 또는 문자열(스키마 확인 후 plan에서 확정).

### 3.3 자격증 (Certificate CRUD) — career 복제
- 동일 레이어. `GET/POST/PUT/DELETE /api/v1/me/certificates`. 필드: name, issuer, acquiredAt, score, orderIndex.

### 3.4 경험 (Experience CRUD) — career 복제
- 동일 레이어. `GET/POST/PUT/DELETE /api/v1/me/experiences`. 필드: type(enum 6종), name, organization, startDate, endDate, role, summary, orderIndex. type 한글 라벨 매핑(인턴/동아리/공모전/봉사/사이드프로젝트/기타).

### 3.5 FE 통합
- `me/page.tsx`: 4개 fetch(profile + educations + certificates + experiences) — `Promise.all` 패턴(calendar 참고).
- `profile-view.tsx`: 실 데이터 렌더 + 섹션별 add/edit/delete. **career의 inline-edit 폼 패턴 재사용**(일관성). 낙관적 또는 refetch.
- 신규 `@/lib/api/{education,certificate,experience,profile}.ts` + `@/lib/types/*`.

## 4. 인터페이스 계약 요약

| 리소스 | 엔드포인트 | 주요 필드 |
|---|---|---|
| 프로필 기초 | `PATCH /me/profile` | name, birthDate, phone, region, introduction |
| 학력 | `GET/POST/PUT{/id}/DELETE{/id} /me/educations` | level, school, major, startDate, endDate, gpa, gpaMax, status |
| 자격증 | `GET/POST/PUT{/id}/DELETE{/id} /me/certificates` | name, issuer, acquiredAt, score |
| 경험 | `GET/POST/PUT{/id}/DELETE{/id} /me/experiences` | type, name, organization, startDate, endDate, role, summary |

각 쓰기 작업은 `userId` ownership 체크. `orderIndex`는 생성 시 자동(career 방식).

## 5. 테스트
- **BE**: 각 CRUD별 통합테스트(career 통합테스트 본보기) — 생성/조회/수정/삭제/cross-user 격리. 기초정보 PATCH 테스트.
- **FE**: `profile-view` 컴포넌트 테스트(api mock) — 실 데이터 렌더, 섹션별 add/edit/delete 호출, 빈 상태. 각 api client 단위 테스트(선택).

## 6. 리스크 / 메모
- 가장 큰 작업. 4 sub-feature → plan에서 task로 분해(BE 3 CRUD 병렬 + 기초정보 + FE 통합). 단일 PR이 커지면 분할 고려(예: BE CRUD PR → FE 배선 PR).
- 스키마 enum 정확도(`education.level/status`, `experience.type`): V1 DDL의 CHECK/타입을 plan 작성 시 확인해 DTO/도메인에 정확 반영.
- career와 중복 아님 확인됨 — 경험(experience)은 인턴·동아리·공모전 등 대외활동, 경력(career)은 회사 근무.

---

spec 통과 → `superpowers:writing-plans` (대형 — task 분해 + 병렬 구현).
