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
| 3 | Schema B — V1 `notification` 테이블 활용 (type-driven) | brainstorm 후 발견: V1 가 이미 sophisticated 한 `notification` 테이블 보유 (channel/type/title/body/payload_json/scheduled_at/sent_at/error 등). type CHECK 가 NotiSettingDef 와 매칭. 별도 테이블 만드는 대신 V1 활용 — v2 email/push 통합 시 schema 변경 없음. FE 가 type → icon/tone 매핑 보유 |
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
| `domain/Notification.java` | 엔티티 (V1 schema 매핑: id, userId, channel, type, title, body, payloadJson, scheduledAt, sentAt, readAt, error, createdAt). `Notification.forInbox(userId, type, title, body, now)` 팩토리 + `markRead(now)` |
| `domain/NotificationChannel.java` | enum: EMAIL / WEB_PUSH / INBOX (V1 CHECK 매핑) |
| `domain/NotificationType.java` | enum: POSTING_DEADLINE_D3 / D1 / SCHEDULE_D1 / COVER_LETTER_UNSUBMITTED_7D / WEEKLY_SUMMARY / EMAIL_VERIFY / PASSWORD_RESET (V1 CHECK 매핑) |
| `repository/NotificationRepository.java` | `findByUserIdAndChannelAndCreatedAtAfterOrderByCreatedAtDesc(userId, channel, since)` / `markAllReadByUserIdAndChannel(userId, channel, now)` `@Modifying` / `deleteAllByUserIdAndChannel(userId, channel)` `@Modifying` |
| `service/NotificationService.java` | `@Transactional` — `list(userId)` / `markAllRead(userId)` / `deleteAll(userId)`. 30일 cutoff + INBOX channel 강제 |
| `service/NotificationProducer.java` | `publish(userId, type, title)` 또는 `publish(userId, type, title, body)` — PR B2/B3 의존 API. INBOX 채널 + sentAt=now |
| `controller/NotificationController.java` | 3 endpoint: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/read-all`, `DELETE /api/v1/notifications` |
| `dto/NotificationItemResponse.java` | record `(id, type: String, title: String, body: String?, createdAt: Instant, readAt: Instant?)` |
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
| `lib/types/notification.ts` | `NotificationItem` / `NotificationIconTone` / `NotificationType` / `NotificationListResponse` |
| `lib/api/notification.ts` | `fetchNotifications` / `markAllRead` / `deleteAllNotifications` |
| `lib/utils/notification-presentation.ts` | `typeToIcon(type)` + `typeToTone(type)` 매핑. V1 의 7 type 모두 cover. fallback default |
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

V1 의 기존 `notification` 테이블을 활용. V5 는 minor 변경만:
1. legacy `notification_preference` 제거 (V4 의 `user_noti_setting` 이 대체)
2. `notification.channel` CHECK 에 `INBOX` 추가 (in-app inbox 전용, 발송 워커 미경유)

```sql
-- V5__notification_inbox.sql

-- 1. legacy notification_preference 제거 (V4 user_noti_setting 이 대체)
DROP TABLE IF EXISTS notification_preference CASCADE;

-- 2. notification.channel 에 'INBOX' 추가 — in-app inbox 전용
ALTER TABLE notification DROP CONSTRAINT ck_notification_channel;
ALTER TABLE notification ADD CONSTRAINT ck_notification_channel
    CHECK (channel IN ('EMAIL', 'WEB_PUSH', 'INBOX'));

COMMENT ON TABLE notification IS '알림. INBOX: in-app inbox (PR B1+). EMAIL/WEB_PUSH: 발송 워커 채널 (v2)';
```

**V1 의 기존 notification 컬럼** (참고):
- `id BIGSERIAL PK`
- `user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE`
- `channel VARCHAR(20)` — CHECK (EMAIL / WEB_PUSH / **INBOX** 추가)
- `type VARCHAR(50)` — CHECK (POSTING_DEADLINE_D3 / D1 / SCHEDULE_D1 / COVER_LETTER_UNSUBMITTED_7D / WEEKLY_SUMMARY / EMAIL_VERIFY / PASSWORD_RESET)
- `title VARCHAR(200) NOT NULL` — 알림 제목 (PR B1 의 display message)
- `body TEXT` — 상세 본문 (PR B1 미사용)
- `payload_json JSONB` — i18n / 변수 (v2)
- `scheduled_at TIMESTAMPTZ` — v2 발송 워커
- `sent_at TIMESTAMPTZ` — 발송 시각 (INBOX 채널은 insert 즉시 now)
- `read_at TIMESTAMPTZ` — 읽음 시각, NULL = unread
- `error TEXT` — 발송 실패 (v2)
- `created_at TIMESTAMPTZ DEFAULT NOW()`

**기존 인덱스** (V1 이미 정의):
- `idx_notif_user_created (user_id, created_at DESC)` — PR B1 의 주 쿼리 활용
- `idx_notif_pending (scheduled_at) WHERE sent_at IS NULL` — v2 워커용

**핵심 결정**:
- 새 테이블 만들지 않음 — V1 design intent 존중
- INBOX 채널 추가 — PR B1 의 알림은 channel='INBOX', sent_at=now() 즉시 set
- FE 가 type → (icon, tone) 매핑 보유 (별도 icon/icon_tone 컬럼 없이)
- `notification_preference` DROP — V4 user_noti_setting 이 supersede

`V5_R__rollback.sql`: legacy 복원 (`notification_preference` 재생성 + INBOX 제거).

---

## 6. API 상세

### 6.1 GET /api/v1/notifications

Response (200):
```json
{
  "notifications": [
    {
      "id": 123,
      "type": "POSTING_DEADLINE_D3",
      "title": "쿠팡 백엔드 (라스트마일) 마감 D-3",
      "body": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "readAt": null
    }
  ]
}
```
- 정렬: `created_at DESC`
- 필터: `created_at > now() - 30d` + `channel = 'INBOX'` (이메일/웹푸시 발송 로그는 inbox 에 미노출 — v2 워커가 별도 관리)
- pagination 없음
- `body` 는 PR B1 에선 항상 null (v2 가 활용)
- FE 가 `type` 으로 icon/tone 매핑

### 6.2 PATCH /api/v1/notifications/read-all

Body 없음. Response 204. SQL: `UPDATE notification SET read_at = now() WHERE user_id = ? AND channel = 'INBOX' AND read_at IS NULL`

### 6.3 DELETE /api/v1/notifications

Body 없음. Response 204. SQL: `DELETE FROM notification WHERE user_id = ? AND channel = 'INBOX'`

(EMAIL/WEB_PUSH 발송 로그는 보존 — v2 발송 워커가 관리)

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

V1 의 7 type CHECK 값만 사용. 6개 sample 모두 type/title 매핑 가능. INBOX 채널 + sentAt=now.

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
            Notification.forInbox(user.getId(), NotificationType.POSTING_DEADLINE_D1,         "카카오 백엔드 (Saas 팀) 서류 마감이 오늘 23:59예요", null, now.minus(Duration.ofHours(3))),
            Notification.forInbox(user.getId(), NotificationType.SCHEDULE_D1,                  "(주)테크컴퍼니 1차면접 일정이 등록됐어요",        null, now.minus(Duration.ofHours(5))),
            Notification.forInbox(user.getId(), NotificationType.WEEKLY_SUMMARY,               "이번 주 자소서·지원 현황 요약을 정리했어요",      null, now.minus(Duration.ofHours(8))),
            Notification.forInbox(user.getId(), NotificationType.COVER_LETTER_UNSUBMITTED_7D,  "네이버 신입 백엔드 자소서를 저장하고 제출하지 않은 지 7일이에요", null, now.minus(Duration.ofDays(1))),
            Notification.forInbox(user.getId(), NotificationType.POSTING_DEADLINE_D3,          "쿠팡 백엔드 (라스트마일) 마감 D-3",              null, now.minus(Duration.ofDays(2))),
            Notification.forInbox(user.getId(), NotificationType.EMAIL_VERIFY,                  "회원가입 인증 메일을 발송했어요",                 null, now.minus(Duration.ofDays(3)))
        ));
    }
}
```

- `@Profile("dev")` — `SPRING_PROFILES_ACTIVE=dev` 시에만 등록
- `repo.count() > 0` — bootRun 반복 호출에 중복 insert 안 함
- prod 영향 0 (Bean 자체 미등록)
- `read_at` 은 모두 NULL (unread) — 사용자가 mark-all-read 직접 동작 검증 가능
- 모두 V1 type CHECK 매칭 — 마이그레이션 위반 없음

## 8.1 FE — type 표시 매핑 (`lib/utils/notification-presentation.ts`)

```typescript
import type { NotificationIconTone } from "@/lib/types/notification";

export type NotificationPresentation = {
  icon: "Bell" | "Check" | "Sparkle" | "FileEdit" | "Plus";
  tone: NotificationIconTone;
};

const MAP: Record<string, NotificationPresentation> = {
  POSTING_DEADLINE_D3:          { icon: "Bell",     tone: "warn"    },
  POSTING_DEADLINE_D1:          { icon: "Bell",     tone: "pink"    },
  SCHEDULE_D1:                  { icon: "Check",    tone: "mint"    },
  COVER_LETTER_UNSUBMITTED_7D:  { icon: "FileEdit", tone: "mint"    },
  WEEKLY_SUMMARY:               { icon: "Sparkle",  tone: "default" },
  EMAIL_VERIFY:                 { icon: "Bell",     tone: "lav"     },
  PASSWORD_RESET:               { icon: "Bell",     tone: "lav"     },
};

const FALLBACK: NotificationPresentation = { icon: "Bell", tone: "default" };

export function notificationPresentation(type: string): NotificationPresentation {
  return MAP[type] ?? FALLBACK;
}
```

V1 의 7 type 모두 cover. 미래 type 추가 시 FALLBACK 으로 안전.

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
