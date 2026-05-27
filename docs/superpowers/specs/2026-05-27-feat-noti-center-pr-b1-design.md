# Notification Center PR B1 — `feat/noti-center-pr-b1` Spec

**브랜치 베이스**: `develop` (`a789553` 시점, PR #26 머지 직후)
**작성일**: 2026-05-27
**상위 컨텍스트**: FE PR #23 (`feat/mypage-cluster`) 의 mock-only `NotiCenterView` + BE PR #25 의 NotiSettingDef 12 정의. mock 을 실 데이터로 교체하는 PR B 시리즈의 1번째.

---

## 1. 목적

mypage cluster 의 알림 센터 (`/mypage/notification-center`) 화면을 mock 에서 실 데이터로 wiring. 사용자가 알림 row 목록 조회 + 모두 읽음 + 전체 삭제 동작 가능.

**핵심 제약**: 알림 producer (cron / 도메인 event 트리거) 는 **PR B2 / PR B3** 으로 분리. PR B1 은 notification core (테이블 + CRUD + FE) + dev seed 데이터로 동작 검증.

---

## 2. Scope decomposition

| Sub-PR | 범위 | 크기 |
|---|---|---|
| **PR B1 (이 spec)** | notification 테이블 + 3 endpoint + FE NotiCenterView wiring + dev seed | M (~10 task) |
| **PR B2** | `@EnableScheduling` 인프라 + 4 cron jobs (deadline-d3/d1, interview-d1, cl-unsubmitted, weekly-summary) + 30일 cleanup cron | M (~6 task) |
| **PR B3** | Event-triggered producer — application/posting/cover-letter/AI/auth 도메인 service 들이 NotificationProducer.publish 호출 | S~M (~8 task) |
| (v2) Email/Push delivery | FCM / SMTP — channel preference 가 실제 발송 결정 | 별도 |

PR B1 머지만으로도 UI live (빈 화면 또는 dev seed 데이터). PR B2/B3 가 데이터 채움.

---

## 3. 핵심 결정

| # | 결정 | 사유 |
|---|---|---|
| 1 | 3 PR 분해 (B1 / B2 / B3) | 한 PR 로 묶으면 폭발. 각 sub-PR 이 detectable 가치 + 머지 cadence 짧음 |
| 2 | PR B1 testing — `@Profile("dev")` seeder | PR B2/B3 머지 전 FE 동작 검증 필요. seeder 가 idempotent + prod 영향 0 |
| 3 | Schema A — 구체 컬럼 (`icon` / `icon_tone` / `message` 모두 BE column) | v1 closed beta — i18n 없음, 메시지 변경 빈도 낮음. Producer 코드 단순 (template 없음). 추후 type-driven 필요 시 v2 마이그레이션 |
| 4 | No pagination + 30일 query filter | 사용자당 월 ~50건 규모. `WHERE created_at > now - 30d ORDER BY DESC` 한 쿼리. cleanup cron 은 PR B2 |
| 5 | TopNav bell — navigation 만 (unread dot 안 함) | polling 인프라 회피. dot 은 PR B3 머지 후 별도 follow-up |
| 6 | Bulk-only + hard delete | mock UI 에 per-row 인터랙션 없음. 알림은 ephemeral (30일) — soft delete 의미 없음 |
| 7 | DeleteAllConfirmModal 신규 (native `confirm()` 안 씀) | PR A 의 modal 패턴 (Nickname/Password/Withdraw) 일관. design system 매칭 |
| 8 | NotificationProducer 서비스 PR B1 에 도입 (seeder 만 사용) | PR B2/B3 가 의존할 API surface 미리 정의. `publish(userId, icon, tone, message)` 가장 단순 시그니처 |

---

## 4. Architecture & 변경 파일

### 4.1 Backend (신규 패키지 `com.twochi.notification`)

| 파일 | 책임 |
|---|---|
| `domain/Notification.java` | 엔티티 `(id, userId, icon, iconTone, message, createdAt, readAt)`. `Notification.of(...)` 정적 팩토리 + `markRead(now)` 메서드 |
| `repository/NotificationRepository.java` | `findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since)` / `markAllReadByUserId(userId, now)` `@Modifying` / `deleteAllByUserId(userId)` `@Modifying` |
| `service/NotificationService.java` | `@Transactional` — `list(userId)` / `markAllRead(userId)` / `deleteAll(userId)`. 30일 cutoff 강제 |
| `service/NotificationProducer.java` | `publish(userId, icon, tone, message)` — PR B2/B3 가 의존할 future-facing API. PR B1 에선 seeder 만 사용 |
| `controller/NotificationController.java` | 3 endpoint: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/read-all`, `DELETE /api/v1/notifications` |
| `dto/NotificationItemResponse.java` | record `(id, icon, iconTone, message, createdAt: Instant, readAt: Instant?)` |
| `dto/NotificationListResponse.java` | record `(notifications: List<NotificationItemResponse>)` |
| `seed/NotificationSeeder.java` | `@Profile("dev")` + `CommandLineRunner`. 첫 사용자에게 sample 6개 insert (idempotent) |

**Migration**: `V5__notification.sql` + `V5_R__rollback.sql`

**Tests** (~10):
- `NotificationServiceTest` (unit) — 30일 filter / mark-all-read / delete-all
- `NotificationControllerIntegrationTest` — 3 endpoint end-to-end + 미인증 401

### 4.2 Frontend

**신규**:
| 파일 | 책임 |
|---|---|
| `lib/types/notification.ts` | `NotificationItem` / `NotificationIconTone` / `NotificationListResponse` |
| `lib/api/notification.ts` | `fetchNotifications` / `markAllRead` / `deleteAllNotifications` |
| `components/mypage/delete-all-confirm-modal.tsx` | PR A modal 패턴 (`pf-modal-backdrop`). danger CTA. inline error |
| `components/mypage/__tests__/delete-all-confirm-modal.test.tsx` | 4 tests |

**수정**:
| 파일 | 변경 |
|---|---|
| `components/mypage/noti-center-view.tsx` | props 제거 → self-fetching + bulk actions. optimistic update + revert (Task 5 NotiSettings 패턴 재사용) |
| `components/mypage/__tests__/noti-center-view.test.tsx` | 전체 교체 — fetch mock + 6 tests |
| `app/(app)/mypage/notification-center/page.tsx` | `<NotiCenterView />` (no props) |
| `lib/mock/mypage.ts` | `NotiCenterEntry` + `NOTI_CENTER_MOCK` 제거. SOCIAL 만 남음 (v2 OAuth) |
| `components/app-shell/top-nav.tsx` | BellIcon click → `router.push("/mypage/notification-center")` (alert 제거) |
| `components/app-shell/__tests__/top-nav.test.tsx` | navigation 검증 1 test 추가 |

**총 변경 ~16 파일** (신규 11 + 수정 5)

---

## 5. 데이터 모델 — Migration V5

```sql
-- V5__notification.sql

CREATE TABLE notification (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    icon        VARCHAR(20)  NOT NULL,
    icon_tone   VARCHAR(10)  NOT NULL,
    message     TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    read_at     TIMESTAMPTZ
);

CREATE INDEX idx_notification_user_created
    ON notification (user_id, created_at DESC);

COMMENT ON TABLE  notification IS '알림 row. 30일 이전은 query filter 로 안 보임. cleanup cron(PR B2)이 hard delete';
COMMENT ON COLUMN notification.icon      IS 'FE 아이콘 키 (Bell / Check / Sparkle / FileEdit / Plus 등)';
COMMENT ON COLUMN notification.icon_tone IS '아이콘 톤 (default / mint / lav / pink / warn)';
COMMENT ON COLUMN notification.read_at   IS '읽음 처리 시각. NULL이면 unread';
```

**핵심 결정**:
- `BIGSERIAL` PK — 다른 테이블과 일관
- `user_id ON DELETE CASCADE` — v2 cron 의 user hard delete 시 자동 정리
- `read_at` nullable — NULL = unread (별도 boolean 컬럼 불필요)
- 복합 인덱스 `(user_id, created_at DESC)` — 주 쿼리가 인덱스 1개로 처리

`V5_R__rollback.sql`: `DROP TABLE IF EXISTS notification;`

---

## 6. API 상세

### 6.1 GET /api/v1/notifications

Response (200):
```json
{
  "notifications": [
    {
      "id": 123,
      "icon": "Bell",
      "iconTone": "pink",
      "message": "카카오 백엔드 (Saas 팀) 서류 마감이 오늘 23:59예요",
      "createdAt": "2026-05-27T00:00:00Z",
      "readAt": null
    }
  ]
}
```
- 정렬: `created_at DESC`
- 필터: `created_at > now() - 30d`
- pagination 없음

### 6.2 PATCH /api/v1/notifications/read-all

Body 없음. Response 204. SQL: `UPDATE notification SET read_at = now() WHERE user_id = ? AND read_at IS NULL`

### 6.3 DELETE /api/v1/notifications

Body 없음. Response 204. SQL: `DELETE FROM notification WHERE user_id = ?`

### 6.4 Auth & Errors

- 모든 endpoint `@AuthenticationPrincipal AuthenticatedUser` — 기존 patterns
- 신규 ErrorCode 0건 — 기존 `UNAUTHENTICATED` (401) 만 사용

---

## 7. FE 변경 상세

### 7.1 NotiCenterView refactor

내부 state: `items: NotificationItem[] | null`, `error`, `confirmingDelete: boolean`. 다음 패턴 적용 (Task 5 NotiSettings 와 일관):
- mount 시 `fetchNotifications` → setItems
- `handleMarkAllRead`: optimistic update (모든 unread 에 readAt=now ISO) → API → 실패 시 revert + error 3초 dismiss
- `handleDeleteAll`: `setConfirmingDelete(true)` → `<DeleteAllConfirmModal>` 마운트
- 빈 상태: `items.length === 0` → "아직 받은 알림이 없어요"
- 날짜 grouping: `formatRelativeKo(new Date(createdAt))` (PR #26 utility 재사용). 동일 날짜는 같은 group 헤더 아래

### 7.2 DeleteAllConfirmModal

`(onClose, onSuccess)` props. PR A 의 WithdrawConfirmModal 와 같은 shell.
- 빨간 경고 박스: "모든 알림이 삭제됩니다. 복구할 수 없어요."
- 단일 "전체 삭제" 버튼 (`.btn danger sm`)
- 성공 시 `onSuccess()` 호출 → 부모가 `setItems([])` + modal close

### 7.3 TopNav

```tsx
const router = useRouter();
// ...
<NavIconButton ariaLabel="알림" onClick={() => router.push("/mypage/notification-center")}>
  <BellIcon />
</NavIconButton>
```

### 7.4 mock cleanup

`lib/mock/mypage.ts` 에서 `NotiCenterEntry` + `NOTI_CENTER_MOCK` 제거. `SOCIAL_MOCK` + `SocialProvider` + `SocialConnection` 만 남음 (v2 OAuth 까지).

---

## 8. Backend Seeder (dev profile only)

```java
@Component
@Profile("dev")
public class NotificationSeeder implements CommandLineRunner {
    private final NotificationRepository repo;
    private final UserRepository userRepo;

    public NotificationSeeder(NotificationRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @Override
    public void run(String... args) {
        if (repo.count() > 0) return;  // idempotent

        User user = userRepo.findAll().stream().findFirst().orElse(null);
        if (user == null) return;

        Instant now = Instant.now();
        repo.saveAll(List.of(
            Notification.of(user.getId(), "Bell",     "pink",    "카카오 백엔드 (Saas 팀) 서류 마감이 오늘 23:59예요", now.minus(Duration.ofHours(3))),
            Notification.of(user.getId(), "Check",    "mint",    "(주)테크컴퍼니 1차면접 일정이 등록됐어요",        now.minus(Duration.ofHours(5))),
            Notification.of(user.getId(), "Sparkle",  "default", "AI가 카카오 공고 매칭 결과를 정리했어요",         now.minus(Duration.ofHours(8))),
            Notification.of(user.getId(), "FileEdit", "mint",    "네이버 신입 백엔드 자소서가 저장됐어요",          now.minus(Duration.ofDays(1))),
            Notification.of(user.getId(), "Bell",     "warn",    "쿠팡 백엔드 (라스트마일) 마감 D-3",              now.minus(Duration.ofDays(2))),
            Notification.of(user.getId(), "Plus",     "default", "기업분석 — 카카오 분석이 완료됐어요",            now.minus(Duration.ofDays(3)))
        ));
    }
}
```

- `@Profile("dev")` — `SPRING_PROFILES_ACTIVE=dev` 시에만 등록
- `repo.count() > 0` — bootRun 반복 호출에 중복 insert 안 함
- prod 영향 0 (Bean 자체 미등록)
- `read_at` 은 모두 NULL (unread) — 사용자가 mark-all-read 직접 동작 검증 가능

---

## 9. 테스트 정책

### 9.1 BE (~10건)

- `NotificationServiceTest`: list / mark-all-read / delete-all + 30일 filter
- `NotificationControllerIntegrationTest`: 3 endpoint + 미인증 401

### 9.2 FE (~11건)

- `noti-center-view.test.tsx` 전체 교체 (6 tests): default / mark-all 정상 / mark-all revert / delete-all modal 열림 / delete-all cancel / empty state
- `delete-all-confirm-modal.test.tsx` 신규 (4 tests): 정상 / API 실패 / 취소 / backdrop
- `top-nav.test.tsx` 갱신 (1 test): bell click → router.push

### 9.3 회귀

- BE: `./gradlew test` 통과 (기존 + 신규)
- FE: `npm run lint && npm run test && npm run build` (기존 214 + 신규 ~11)

### 9.4 수동 sanity

dev 프로필 + Postgres up + frontend dev:
1. signup alice → login → `/mypage/notification-center`
2. seed 6개 표시 확인 (5 unread + 1 read)
3. "모두 읽음" → 모두 read 상태 → 새로고침 후 유지
4. "전체 삭제" → modal confirm → 빈 상태
5. TopNav bell click → 같은 페이지 이동

---

## 10. 리스크 · Rollback

| 리스크 | 완화 |
|---|---|
| seeder 가 다른 user 도 있을 때 첫 사용자만 seed → 새 사용자 가입 시 seed 없음 | acceptable — PR B3 머지 후 실 producer 동작 |
| `iconTone` VARCHAR 의 typo silent fail | FE 의 tone class map 에 없는 값 → default 톤 폴백 |
| 30일 filter 누락 시 전체 fetch | repository method 시그니처에 `createdAtAfter` 강제 |
| PR B2/B3 가 NotificationProducer 시그니처 변경 필요 시 PR B1 의 publish 수정 | 가장 단순한 (userId, icon, tone, message) 시그니처. 추가 시 overload (backward compat) |
| seeder 가 prod 에서 동작 | `@Profile("dev")` + deploy 시 `SPRING_PROFILES_ACTIVE` 명시 점검 |

### Rollback

- PR B1 단독 머지 후 회귀 → revert (BE + FE 같이)
- V5 migration: `V5_R__rollback.sql` 같이 (DROP TABLE)

---

## 11. Out of Scope

| 항목 | 이동 |
|---|---|
| Cron (`@EnableScheduling`) + 4 scheduled jobs (deadline-d3/d1/interview-d1/cl-unsubmitted/weekly-summary) | PR B2 |
| 30일 이전 row cleanup cron | PR B2 |
| Event-triggered producer (auth/application/posting/AI/cover-letter) | PR B3 |
| TopNav unread dot + polling | PR B3 머지 후 small follow-up |
| Email/Push 채널 통합 (FCM/SMTP) | v2 |
| Per-row mark-read 인터랙션 | v2 (mock UI 에 없음) |
| 알림 카테고리 필터 / 검색 | v2 |
| `NotiSettingDef.enabled` 따른 publish 차단 | PR B3 (producer 측 책임) |
| Pagination | v2 |
| `type` 필드 (DEADLINE_D3 등) — 분류/필터용 | v2 (schema 마이그레이션) |

---

## 12. Next Step

spec 통과 → `superpowers:writing-plans` 로 task-by-task 구현 plan 작성. PR B2 / B3 는 별도 spec/plan cycle.
