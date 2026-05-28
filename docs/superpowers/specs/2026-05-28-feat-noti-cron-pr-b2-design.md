# `feat/noti-cron-pr-b2` Design Spec

> PR B 시리즈 2번째. PR B1(#27, notification core + producer)이 정의한 `NotificationProducer.publish()` 위에 **cron 기반 알림 생성 + 30일 cleanup** 을 얹는다. EMAIL_VERIFY / PASSWORD_RESET (이벤트 기반)은 B3 로 분리.

- 작성일: 2026-05-28
- 선행: PR B1 (#27) — notification 테이블 / `NotificationProducer` / `NotiSettingDef`(V4) / `UserNotiSetting`
- 트랙: BACKEND

## 1. 목표 / 범위

매일·매주 주기적으로 발생하는 알림 5종을 cron 으로 생성하고, 30일 지난 알림을 hard delete 한다.

| type | 트리거 | 주기 |
|---|---|---|
| `POSTING_DEADLINE_D3` | 공고 마감 3일 전 | 매일 |
| `POSTING_DEADLINE_D1` | 공고 마감 1일 전 | 매일 |
| `SCHEDULE_D1` | 지원 일정(면접/코테/서류/협상) 1일 전 | 매일 |
| `COVER_LETTER_UNSUBMITTED_7D` | 마감 전 공고의 DRAFT 자소서가 7일 방치됨 (opt-in) | 매일 (dedup 1회) |
| `WEEKLY_SUMMARY` | 주간 활동 요약 | 매주 월요일 |
| (cleanup) | 30일 이전 알림 hard delete | 매일 |

**범위 밖 (B3 / v2)**: 이벤트 기반 알림(EMAIL_VERIFY·PASSWORD_RESET), 알림 클릭 시 deep link navigation, EMAIL/WEB_PUSH 채널.

## 2. 아키텍처

`notification` 모듈 집중형. 도메인(posting/application/coverletter)은 **read-only 조회만** 당하고, 알림 생성 책임은 notification 에 모은다.

```
NotificationScheduler (@Scheduled, @Profile("prod"))
        │  매일 09:00 KST 호출
        ▼
NotificationGenerator (@Service)
        ├─ generatePostingDeadline(today)      → JobPostingRepository (read)
        ├─ generateScheduleD1(today)           → EventRepository (read)
        ├─ generateCoverLetterUnsubmitted(now) → CoverLetterVariantRepository (read)
        ├─ generateWeeklySummary(today)        [월요일만]
        └─ cleanup(now)                        → NotificationRepository.deleteByCreatedAtBefore
        │
        ▼ (각 generator 내부)
   설정 on 확인 (UserNotiSetting) → dedup 체크 (existsByUserIdAndDedupKey)
        ▼
NotificationProducer.publish(userId, type, title)   // B1 의 기존 API
        │  + dedup_key 세팅 (B2 에서 publish overload 추가)
        ▼
   notification INSERT (unique(user_id, dedup_key) 가 동시성 안전망)

DevNotificationController (@Profile("dev"))
   POST /api/v1/dev/notifications/run-cron  → NotificationGenerator 직접 호출 (수동 검증)
```

## 3. 데이터 모델 — `V6` migration

```sql
-- V6__notification_dedup_key.sql
ALTER TABLE notification ADD COLUMN dedup_key VARCHAR(120);

-- 같은 사용자에게 같은 알림이 중복 생성되지 않도록 (NULL 은 제약 대상 아님 — B1 seeder/수동 알림 보존)
CREATE UNIQUE INDEX uq_notification_user_dedup
    ON notification (user_id, dedup_key)
    WHERE dedup_key IS NOT NULL;

COMMENT ON COLUMN notification.dedup_key IS
    'cron 멱등 키. type+참조ID 조합(예: PD_D1:42). NULL=dedup 비대상(이벤트/수동 알림). PR B2.';
```

- `V6_R__rollback.sql`: `DROP INDEX uq_notification_user_dedup; ALTER TABLE notification DROP COLUMN dedup_key;`
- `Notification` 엔티티에 `dedupKey` 필드 + `forInbox(...)` 에 dedup_key 받는 overload 추가.

### dedup_key 규칙

| type | dedup_key 형식 | 멱등 단위 |
|---|---|---|
| `POSTING_DEADLINE_D3` | `PD_D3:{postingId}` | 공고별 1회 |
| `POSTING_DEADLINE_D1` | `PD_D1:{postingId}` | 공고별 1회 |
| `SCHEDULE_D1` | `SCH_D1:{eventId}` | 일정별 1회 |
| `COVER_LETTER_UNSUBMITTED_7D` | `CL7:{variantId}` | variant 별 1회 (7일 경과 후 영구 1회) |
| `WEEKLY_SUMMARY` | `WK:{userId}:{ISO주차}` (예 `WK:5:2026-W22`) | 사용자·주차별 1회 |

## 4. Generator 별 조회 조건 & 문구

문구 톤: 해요체·청유형, "이취가 …" 페르소나. body 는 전부 `null` (title-only).

### 4.1 POSTING_DEADLINE_D3 / D1
- 조회: `JobPostingRepository.findByDeadline(today.plusDays(3))` / `findByDeadline(today.plusDays(1))`
  - `deletedAt IS NULL` (soft delete 컬럼 있으면)
- 대상: 각 posting 의 `userId`
- 문구:
  - D3: `"{company} {title} 마감이 3일 남았어요"`
  - D1: `"{company} {title} 마감이 내일이에요"`

### 4.2 SCHEDULE_D1
- 조회: `EventRepository.findByEventDate(today.plusDays(1))`
  - **일정류 type 만**: `DOC_DEADLINE, CODING_TEST, FIRST_INTERVIEW, SECOND_INTERVIEW, EXEC_INTERVIEW, NEGOTIATION`
  - 결과/기타(`PASSED, FAILED, ETC`) 제외
- 대상: Event → Application → `userId`, 회사명은 Application 의 `company`
- 문구: `"{company} {일정 한글} 일정이 내일이에요"` (예: "(주)테크컴퍼니 1차 면접 일정이 내일이에요")
  - EventType → 한글 매핑 테이블 (서류 마감 / 코딩테스트 / 1차 면접 / 2차 면접 / 임원 면접 / 처우 협상)

### 4.3 COVER_LETTER_UNSUBMITTED_7D
- 조회: `CoverLetterVariantRepository` where:
  - `status = DRAFT` — 사용자가 "완료 저장" 을 안 함. ("임시 저장"=DRAFT / "완료 저장"=COMPLETED 두 버튼으로 명시 구분, `write-content.tsx` + `VariantPatchRequest.status`)
  - `postingId IS NOT NULL` — 공고에 연결된 자소서만. 범용 초안(마스터 기반, postingId null)은 마감 개념이 없어 제외.
  - `posting.deadline >= today` — 마감 안 지남. 마감 지난 공고는 지원 불가라 알림 무의미 → 제외.
  - `updatedAt <= now-7d` — 마지막 수정 7일 경과 = 방치.
  - `deletedAt IS NULL`
- **기준 = updatedAt(마지막 수정)**. 작업 중(7일 내 수정)이면 타이머 리셋되어 알림 안 감. "마감 임박" 신호는 POSTING_DEADLINE_D3/D1 이 담당하므로 여기선 추가 트리거 없이 7일 방치만 본다(역할 분담 / 중복 방지).
- 대상: variant 의 `userId`, 회사명은 `postingId` → JobPosting `company`
- 문구: `"{company} 자소서가 아직 작성 중이에요. 마감 전에 마무리해볼까요?"`
- dedup `CL7:{variantId}` 1회 (7일 방치 첫 도달 시 1회. 재수정 후 재방치해도 재알림 없음 — v1 허용)

### 4.4 WEEKLY_SUMMARY (월요일만)
- 대상: 온보딩 완료한 전체 사용자 (또는 지난주 활동 있는 사용자)
- 집계 (지난 7일, `now-7d ~ now`):
  - **지원 N건**: 지난주 생성된 Application 수
  - **자소서 초안 N건**: 지난주 생성/수정된 DRAFT variant 수
- 문구: `"이번 주 지원 {N}건·자소서 초안 {M}건을 정리했어요"`
  - 둘 다 0 이면 발송 생략 (빈 요약 알림 안 보냄)

## 5. 알림 설정 연동

`NotificationType` → `settingId` 매핑 + `NotiSettingDef.defaultOn`(디자인 시스템 알림설정 화면과 1:1):

| type | settingId | defaultOn | 성격 |
|---|---|---|---|
| `POSTING_DEADLINE_D3` | `deadline-d3` | **ON** | 핵심 (공고 마감 임박) |
| `POSTING_DEADLINE_D1` | `deadline-d1` | **ON** | 핵심 |
| `SCHEDULE_D1` | `interview-d1` | **ON** | 핵심 (일정 D-1) |
| `COVER_LETTER_UNSUBMITTED_7D` | `cl-unsubmitted` | **OFF** | opt-in (방치 자소서) |
| `WEEKLY_SUMMARY` | `weekly-summary` | **OFF** | opt-in |

- 각 generator 가 publish 전: `UserNotiSettingRepository.findByUserIdAndSettingId(userId, settingId)`
  - row 있으면 `enabled` 값 사용
  - row 없으면 `NotiSettingDef.fromId(settingId).defaultOn()` 사용
  - `false` 면 skip
- **알림 양 관리**: 핵심 3종(공고 마감 D-3/D-1, 일정 D-1)만 기본 ON. 자소서 미제출·주간요약은 기본 OFF(사용자가 켜야 수신). cron 은 5종 모두 구현하되 default 가 양을 조절.
- 성능: 사용자 수가 적은 v1 에선 per-user 조회로 충분. (대량 시 settingId 별 일괄 조회로 최적화 — v2)

## 6. 스케줄 + cleanup + dev 트리거

- `NotificationScheduler`:
  - `@Profile("prod")` — dev/test 에선 자동 실행 안 함
  - `@Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")` — 매일 09:00 KST
  - 호출 순서: D3 → D1 → SCHEDULE → CL7 → (월요일이면 WEEKLY_SUMMARY) → cleanup
  - 월요일 판정: `LocalDate.now(KST).getDayOfWeek() == MONDAY`
- `cleanup`: `NotificationRepository.deleteByCreatedAtBefore(now.minus(30d))` (`@Modifying @Query` bulk delete)
- `DevNotificationController` (`@Profile("dev")`):
  - `POST /api/v1/dev/notifications/run-cron` → `NotificationGenerator.runAll(LocalDate)` 호출 (today override 가능하게 optional `?date=` 쿼리)
  - 수동 검증·QA 용. prod 빌드엔 미포함.

## 7. 테스트 전략

- `NotificationGeneratorTest` (unit, `@DataJpaTest` 또는 mock repo):
  - 각 type 조회 조건 정확성 (D3/D1 날짜 경계, SCHEDULE type 필터, CL7 7일 경계)
  - 설정 off → skip, row 없음 → default 적용
  - 빈 WEEKLY_SUMMARY (0건) → 발송 생략
- `NotificationCronIntegrationTest`:
  - 동일 cron **2회 실행** → 알림 수 불변 (dedup unique 동작 증명)
  - cleanup: 31일 전 알림 삭제, 29일 전 보존 (경계)
- `DevNotificationControllerTest` (integration): 수동 트리거 → 알림 생성 확인
- dedup unique 충돌 시 `DataIntegrityViolationException` graceful handling (existsBy 선체크 + 충돌 무시)

## 8. 결정 사항 / 가정

### 결정됨 (brainstorming)
- 자소서 미제출: **마감 임박 추가 트리거 안 함** (공고 마감 알림이 담당), **postingId null 제외**, **updatedAt 7일 방치 기준**.
- 알림 5종 모두 구현, default 는 NotiSettingDef.defaultOn 그대로 (핵심 3종 ON / 자소서·주간 OFF).

### 가정 (Task 1 에서 재확인)
- `JobPosting`, `Event`(via Application), `CoverLetterVariant` 모두 `userId` 로 소유자 추적 가능. (B1 까지 구현된 도메인에서 확인됨)
- `Application` 에 `company` 문자열 필드 존재 (SCHEDULE_D1 문구용).
- CL7 은 `CoverLetterVariant` → `JobPosting`(postingId) 조인으로 `deadline`·`company` 참조.
- soft-delete 컬럼(`deletedAt`) 유무는 도메인별로 Task 1 에서 확인 후 조회 조건 확정.
- WEEKLY_SUMMARY 대상 사용자 범위는 v1 기본 "전체 온보딩 완료 사용자" — 성능 이슈 시 "지난주 활동자" 로 축소 (Task 4).
