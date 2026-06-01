# PR B3 — Event-triggered producer (가입 축하 알림) 설계

> PR B 시리즈 3번째(마무리). PR B1(#27)이 정의한 `NotificationProducer` + PR B2(#30)의 cron 발행 위에, **도메인 이벤트 트리거 발행**의 첫 연결로 **회원가입 완료 시 환영 알림**을 얹는다. cron(B2)이 "시스템이 일정·마감을 챙겨주는" 가치를 담당한다면, B3는 "의미 있는 첫 순간을 짚어주는" event-triggered 발행 인프라의 출발점이다.

## 1. 목표 / 범위

**목표:** 회원가입 완료 시점에 INBOX 채널 환영 알림 1건을 멱등하게 발행한다. 발행은 `@TransactionalEventListener(AFTER_COMMIT)` 기반으로 가입 트랜잭션과 디커플링한다.

**범위 안 (B3):**
- 회원가입 완료 → 환영 알림 1종 (INBOX)
- AFTER_COMMIT 이벤트 리스너 발행 인프라 (향후 도메인 이벤트 확장 지점)
- `WELCOME` NotificationType 추가 + V7 CHECK 마이그레이션
- FE icon/tone 매핑 (Sparkle/mint)

**범위 밖 (의식적 결정):**
- **자소서 새 초안 / 지원 상태 변경** — 사용자가 동기적으로 직접 수행하는 행동이라, 방금 한 일을 알림으로 되읽어주는 redundant 노이즈. 넣지 않음.
- **EMAIL_VERIFY / PASSWORD_RESET** — 실 메일 발송 인프라(provider·토큰·verify 엔드포인트)가 전무. 별도 PR.
- **마일스톤(첫 마스터·첫 지원 등록)** — 도그푸딩 피드백으로 가치 확인 후 v2.
- **gating(NotiSettingDef.enabled)** — B2의 `NotiSettingResolver`가 이미 cron에서 처리. 환영 알림은 일회성 환영이라 설정으로 끌 항목이 아님 → **무조건 발송**.
- **TopNav unread dot + polling** — B 시리즈 머지 후 별도 follow-up.

## 2. 아키텍처 / 데이터 흐름

```
SignupService.signup()  [@Transactional]
  ├─ user 저장 + consent 로그            (기존)
  └─ eventPublisher.publishEvent(            ← 추가
        new UserSignedUpEvent(user.getId()))
        │
        ▼  (가입 tx COMMIT 후에만)
  WelcomeNotificationListener
    @TransactionalEventListener(phase = AFTER_COMMIT)
      └─ producer.publishDeduped(
             userId, WELCOME, "<환영 문구>", dedupKey="WELCOME")
            └─ INBOX notification 1건
               (멱등: (user_id, dedup_key) UNIQUE — V6)
```

**핵심 설계점:**

1. **AFTER_COMMIT 발행** — 가입 트랜잭션이 커밋된 *뒤에만* 리스너가 발화. 가입이 롤백되면 유령 알림이 안 생기고, 알림 저장 실패가 가입을 롤백시키지 못한다(핵심 플로우 보호). 리스너가 호출하는 `producer.publishDeduped`는 `@Transactional`이므로 커밋 이후 새 트랜잭션에서 실행된다.

2. **멱등 발행(`publishDeduped`, dedupKey="WELCOME")** — 사용자당 환영 알림 영구 1건 보장. 이벤트 중복 발화·재시도에도 `(user_id, dedup_key)` UNIQUE 제약(V6)이 안전망. dedupKey는 참조 ID가 없는 per-user 1회성이므로 `"WELCOME"` 단일 문자열.

3. **이벤트 소유권** — `UserSignedUpEvent`는 발행자(auth)가 소유(`com.twochi.auth.event`). 리스너(consumer)는 notification 패키지(`com.twochi.notification.listener`). auth → notification 단방향 의존만 추가.

## 3. 변경 파일

| 파일 | 작업 | 내용 |
|---|---|---|
| `auth/event/UserSignedUpEvent.java` | 신규 | `public record UserSignedUpEvent(Long userId) {}` |
| `auth/service/SignupService.java` | 수정 | `ApplicationEventPublisher` 주입 + `return` 직전 `publishEvent(new UserSignedUpEvent(user.getId()))` |
| `notification/listener/WelcomeNotificationListener.java` | 신규 | `@TransactionalEventListener(phase = AFTER_COMMIT)` 메서드 → `producer.publishDeduped(...)` |
| `notification/domain/NotificationType.java` | 수정 | `WELCOME` 추가. `settingId()`의 `WELCOME` case는 `throw new UnsupportedOperationException("WELCOME은 ungated — 설정 없음")` (ungated 계약을 명시; 누군가 나중에 gating에 끼우면 즉시 실패) |
| `db/migration/V7__notification_welcome_type.sql` | 신규 | `ck_notification_type` drop & re-add + `'WELCOME'` |
| `db/migration/V7_R__rollback.sql` | 신규 | 기존 `*_R__rollback.sql` 패턴 따라 (제약 원복) |
| `frontend/src/lib/utils/notification-presentation.ts` | 수정 | `MAP`에 `WELCOME: { icon: "Sparkle", tone: "mint" }` (없어도 FALLBACK 동작하나 톤 일치) |

### V7 마이그레이션 (forward)

```sql
ALTER TABLE notification DROP CONSTRAINT ck_notification_type;
ALTER TABLE notification ADD CONSTRAINT ck_notification_type
    CHECK (type IN (
        'POSTING_DEADLINE_D3', 'POSTING_DEADLINE_D1', 'SCHEDULE_D1',
        'COVER_LETTER_UNSUBMITTED_7D', 'WEEKLY_SUMMARY',
        'EMAIL_VERIFY', 'PASSWORD_RESET', 'WELCOME'
    ));
```

## 4. 카피 (브랜드 톤)

- 제목: **"이취 시작을 축하해요! 첫 자소서부터 차근차근 정리해드릴게요"**
  - 톤 키워드 hit: 정리·준비 / 페르소나 "이취가 …해드릴게요" / 해요체·격려
- body: `null` (INBOX 아이템은 title만 렌더)

## 5. 테스트

- **`WelcomeNotificationIntegrationTest` (신규)**
  - `회원가입_완료시_환영알림_생성` — signup 호출 → 커밋 후 해당 user에 `WELCOME` INBOX 알림 1건. `@TransactionalEventListener(AFTER_COMMIT)`가 발화하려면 테스트가 실제 커밋해야 하므로, 기존 통합테스트 컨벤션(테스트 메서드 `@Transactional` 미사용 + 명시적 커밋/별도 트랜잭션)을 따른다.
  - `환영알림_멱등` — 같은 userId로 `UserSignedUpEvent` 2회 발화 → 알림 여전히 1건 (dedup).
  - `가입_롤백시_환영알림_미생성` — 가입 tx가 롤백되면 AFTER_COMMIT 미발화 → 알림 0건.
- 기존 `SignupService` 단위/통합 테스트는 이벤트 발행 추가로 깨지지 않아야 함(발행은 부수효과, 반환값 불변).

## 6. 규모 / 리스크

- 규모: ~4 task (① event+listener 배선 · ② WELCOME type + V7 마이그레이션 · ③ FE meta · ④ 통합 테스트). 작은 PR — B 시리즈 마무리에 적합.
- 리스크: AFTER_COMMIT 리스너의 테스트 발화 패턴이 유일한 함정. 기존 통합테스트 트랜잭션 컨벤션을 먼저 확인하고 맞춘다.

## 7. Out of scope / follow-up

| 항목 | 위치 |
|---|---|
| 자소서 새 초안 / 지원 상태 변경 이벤트 | 제외(redundant) — 필요 시 v2 재검토 |
| EMAIL_VERIFY / PASSWORD_RESET 실 메일 | 별도 PR (메일 인프라 선행) |
| 마일스톤(첫 마스터·첫 지원) | v2 (도그푸딩 피드백 후) |
| TopNav unread dot + polling | B 시리즈 후속 small follow-up |

---

spec 통과 → `superpowers:writing-plans`로 task-by-task 구현 plan 작성.
