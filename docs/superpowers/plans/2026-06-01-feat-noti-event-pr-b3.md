# PR B3 — 가입 축하 event-triggered 알림 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회원가입 완료 시 INBOX 환영 알림 1건을 AFTER_COMMIT 이벤트 리스너로 멱등하게 발행한다.

**Architecture:** `SignupService`가 커밋 직전 `UserSignedUpEvent`를 발행하고, `@TransactionalEventListener(AFTER_COMMIT)` 리스너가 가입 커밋 후 `NotificationProducer.publishDeduped`로 환영 알림을 생성한다. 가입과 알림을 디커플링해 알림 실패가 가입을 막지 못하게 한다.

**Tech Stack:** Spring Boot (Java), JPA, Flyway, JUnit5 + AssertJ, Next.js/Vitest (FE).

**Spec:** `docs/superpowers/specs/2026-06-01-feat-noti-event-pr-b3-design.md`

---

## File Structure

| 파일 | 책임 |
|---|---|
| `notification/domain/NotificationType.java` (수정) | `WELCOME` enum 값. ungated 계약(`settingId()` throw) |
| `db/migration/V7__notification_welcome_type.sql` (신규) | `ck_notification_type` CHECK에 `'WELCOME'` 추가 |
| `db/migration/V7_R__rollback.sql` (신규) | CHECK 원복 |
| `auth/event/UserSignedUpEvent.java` (신규) | 가입 완료 도메인 이벤트 (발행자=auth 소유) |
| `auth/service/SignupService.java` (수정) | 가입 커밋 직전 이벤트 발행 |
| `notification/listener/WelcomeNotificationListener.java` (신규) | AFTER_COMMIT 구독 → 환영 알림 발행 (소비자=notification) |
| `frontend/src/lib/utils/notification-presentation.ts` (수정) | `WELCOME` icon/tone 매핑 |

---

## Task 1: WELCOME NotificationType + V7 마이그레이션

가입 알림이 의존할 `WELCOME` 타입과, 그 값을 DB가 허용하도록 CHECK 제약을 확장한다.

**Files:**
- Modify: `backend/src/main/java/com/twochi/notification/domain/NotificationType.java`
- Create: `backend/src/main/resources/db/migration/V7__notification_welcome_type.sql`
- Create: `backend/src/main/resources/db/migration/V7_R__rollback.sql`
- Test: `backend/src/test/java/com/twochi/notification/WelcomeTypeMigrationTest.java`

- [ ] **Step 1: Write the failing test**

`backend/src/test/java/com/twochi/notification/WelcomeTypeMigrationTest.java`:

```java
package com.twochi.notification;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class WelcomeTypeMigrationTest {

    private static final String HASH =
        "$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUV0123";

    @Autowired UserRepository userRepository;
    @Autowired NotificationRepository notificationRepository;

    private Long userId;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();
        userId = userRepository.save(
            User.createEmailUser("welcome-type@example.com", HASH, "wtype")).getId();
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void WELCOME_타입_알림_저장_성공() {
        Notification saved = notificationRepository.save(
            Notification.forInboxDeduped(
                userId, NotificationType.WELCOME, "환영", null, Instant.now(), "WELCOME"));

        assertThat(saved.getId()).isNotNull();
        assertThat(notificationRepository.findById(saved.getId()).orElseThrow().getType())
            .isEqualTo(NotificationType.WELCOME);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./gradlew test --tests "com.twochi.notification.WelcomeTypeMigrationTest"`
Expected: COMPILE FAIL — `NotificationType.WELCOME` 심볼 없음.

- [ ] **Step 3: Add WELCOME to NotificationType**

`NotificationType.java` — enum 목록 끝에 `WELCOME` 추가:

```java
    WEEKLY_SUMMARY,
    EMAIL_VERIFY,
    PASSWORD_RESET,
    WELCOME;
```

그리고 `settingId()` switch에 `WELCOME` case 추가 (ungated 계약 명시):

```java
            case PASSWORD_RESET -> "pw-reset";
            case WELCOME -> throw new UnsupportedOperationException(
                "WELCOME 은 ungated(항상 발송) — 대응 설정 없음. gating 경로에서 호출 금지.");
        };
```

클래스 Javadoc의 type 매핑 주석에도 한 줄 추가:

```java
 * - WELCOME → (ungated, 설정 없음) — 가입 축하, 항상 발송
```

- [ ] **Step 4: Write V7 forward migration**

`backend/src/main/resources/db/migration/V7__notification_welcome_type.sql`:

```sql
-- notification.type CHECK 에 WELCOME 추가 (PR B3 가입 축하 event-triggered 알림)
ALTER TABLE notification DROP CONSTRAINT ck_notification_type;
ALTER TABLE notification ADD CONSTRAINT ck_notification_type
    CHECK (type IN (
        'POSTING_DEADLINE_D3', 'POSTING_DEADLINE_D1', 'SCHEDULE_D1',
        'COVER_LETTER_UNSUBMITTED_7D', 'WEEKLY_SUMMARY',
        'EMAIL_VERIFY', 'PASSWORD_RESET', 'WELCOME'
    ));
```

- [ ] **Step 5: Write V7 rollback migration**

`backend/src/main/resources/db/migration/V7_R__rollback.sql`:

```sql
ALTER TABLE notification DROP CONSTRAINT ck_notification_type;
ALTER TABLE notification ADD CONSTRAINT ck_notification_type
    CHECK (type IN (
        'POSTING_DEADLINE_D3', 'POSTING_DEADLINE_D1', 'SCHEDULE_D1',
        'COVER_LETTER_UNSUBMITTED_7D', 'WEEKLY_SUMMARY',
        'EMAIL_VERIFY', 'PASSWORD_RESET'
    ));
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && ./gradlew test --tests "com.twochi.notification.WelcomeTypeMigrationTest"`
Expected: PASS — WELCOME 알림이 CHECK 위반 없이 저장됨.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/twochi/notification/domain/NotificationType.java \
        backend/src/main/resources/db/migration/V7__notification_welcome_type.sql \
        backend/src/main/resources/db/migration/V7_R__rollback.sql \
        backend/src/test/java/com/twochi/notification/WelcomeTypeMigrationTest.java
git commit -m "feat(nc): WELCOME notification type + V7 CHECK 마이그레이션 (B3)"
```

---

## Task 2: UserSignedUpEvent + AFTER_COMMIT 리스너 + SignupService 배선

가입 완료 이벤트를 발행하고, 커밋 후 환영 알림을 멱등 생성한다.

**Files:**
- Create: `backend/src/main/java/com/twochi/auth/event/UserSignedUpEvent.java`
- Create: `backend/src/main/java/com/twochi/notification/listener/WelcomeNotificationListener.java`
- Modify: `backend/src/main/java/com/twochi/auth/service/SignupService.java`
- Test: `backend/src/test/java/com/twochi/notification/WelcomeNotificationIntegrationTest.java`

- [ ] **Step 1: Write the failing test**

`backend/src/test/java/com/twochi/notification/WelcomeNotificationIntegrationTest.java`:

```java
package com.twochi.notification;

import com.twochi.auth.dto.SignupRequest;
import com.twochi.auth.service.SignupService;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationChannel;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.notification.service.NotificationProducer;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class WelcomeNotificationIntegrationTest {

    private static final String HASH =
        "$2a$10$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTUV0123";

    @Autowired SignupService signupService;
    @Autowired NotificationProducer producer;
    @Autowired UserRepository userRepository;
    @Autowired NotificationRepository notificationRepository;
    @Autowired ConsentLogRepository consentLogRepository;

    @BeforeEach
    @AfterEach
    void clean() {
        notificationRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
    }

    private SignupRequest validReq() {
        return new SignupRequest(
            "welcome-it@example.com", "Pass1234!", "wcomeit", true,
            new SignupRequest.Consents(true, true, false));
    }

    @Test
    void 회원가입_완료시_환영알림_1건_생성() {
        signupService.signup(validReq(), "127.0.0.1", "test-agent");

        List<Notification> all = notificationRepository.findAll();
        assertThat(all).hasSize(1);
        Notification n = all.get(0);
        assertThat(n.getType()).isEqualTo(NotificationType.WELCOME);
        assertThat(n.getChannel()).isEqualTo(NotificationChannel.INBOX);
        assertThat(n.getDedupKey()).isEqualTo("WELCOME");
        assertThat(n.getTitle()).contains("축하");
    }

    @Test
    void 환영알림_같은_user_중복발행시_1건() {
        Long userId = userRepository.save(
            User.createEmailUser("dup-welcome@example.com", HASH, "dupw")).getId();

        producer.publishDeduped(userId, NotificationType.WELCOME, "환영", "WELCOME");
        producer.publishDeduped(userId, NotificationType.WELCOME, "환영", "WELCOME");

        assertThat(notificationRepository.count()).isEqualTo(1);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./gradlew test --tests "com.twochi.notification.WelcomeNotificationIntegrationTest"`
Expected: FAIL — `회원가입_완료시_환영알림_1건_생성`에서 알림 0건 (이벤트/리스너 미구현). (`중복발행` 테스트는 이미 통과할 수 있음.)

- [ ] **Step 3: Create UserSignedUpEvent**

`backend/src/main/java/com/twochi/auth/event/UserSignedUpEvent.java`:

```java
package com.twochi.auth.event;

/** 회원가입 완료(커밋 예정) 도메인 이벤트. notification 모듈이 AFTER_COMMIT 으로 구독. */
public record UserSignedUpEvent(Long userId) {}
```

- [ ] **Step 4: Create WelcomeNotificationListener**

`backend/src/main/java/com/twochi/notification/listener/WelcomeNotificationListener.java`:

```java
package com.twochi.notification.listener;

import com.twochi.auth.event.UserSignedUpEvent;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.NotificationProducer;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 가입 완료 → 환영 알림 발행. 가입 트랜잭션 커밋 후에만 발화(AFTER_COMMIT)하여
 * 가입/알림을 디커플링. publishDeduped(dedupKey="WELCOME") 로 사용자당 1건 멱등.
 */
@Component
public class WelcomeNotificationListener {

    private static final String WELCOME_TITLE =
        "이취 시작을 축하해요! 첫 자소서부터 차근차근 정리해드릴게요";
    private static final String WELCOME_DEDUP_KEY = "WELCOME";

    private final NotificationProducer producer;

    public WelcomeNotificationListener(NotificationProducer producer) {
        this.producer = producer;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserSignedUp(UserSignedUpEvent event) {
        producer.publishDeduped(
            event.userId(), NotificationType.WELCOME, WELCOME_TITLE, WELCOME_DEDUP_KEY);
    }
}
```

- [ ] **Step 5: Wire SignupService to publish the event**

`SignupService.java` — `ApplicationEventPublisher` import + 필드 + 생성자 파라미터 추가:

```java
import org.springframework.context.ApplicationEventPublisher;
import com.twochi.auth.event.UserSignedUpEvent;
```

필드 추가:

```java
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
```

생성자 시그니처/본문에 추가:

```java
    public SignupService(UserRepository userRepository,
                         ConsentLogRepository consentLogRepository,
                         PasswordEncoder passwordEncoder,
                         ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.consentLogRepository = consentLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
    }
```

`signup(...)` 의 `return` 직전에 이벤트 발행:

```java
        eventPublisher.publishEvent(new UserSignedUpEvent(user.getId()));

        return new SignupResponse(user.getId(), user.getEmail(), user.getNickname());
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && ./gradlew test --tests "com.twochi.notification.WelcomeNotificationIntegrationTest"`
Expected: PASS — signup 커밋 후 AFTER_COMMIT 리스너가 동기 발화해 WELCOME 알림 1건 생성. 중복발행 테스트도 PASS.

- [ ] **Step 7: Run the full auth + notification test suite (회귀 확인)**

Run: `cd backend && ./gradlew test --tests "com.twochi.auth.*" --tests "com.twochi.notification.*"`
Expected: PASS — 기존 SignupIntegrationTest 등 회귀 없음(이벤트 발행은 반환값 불변 부수효과).

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/twochi/auth/event/UserSignedUpEvent.java \
        backend/src/main/java/com/twochi/notification/listener/WelcomeNotificationListener.java \
        backend/src/main/java/com/twochi/auth/service/SignupService.java \
        backend/src/test/java/com/twochi/notification/WelcomeNotificationIntegrationTest.java
git commit -m "feat(nc): 가입 축하 환영 알림 — AFTER_COMMIT 이벤트 리스너 (B3)"
```

---

## Task 3: FE icon/tone 매핑

환영 알림을 Sparkle/mint 톤으로 표시한다(미설정 시 FALLBACK Bell/default로 동작하나 톤 일치를 위해 추가).

**Files:**
- Modify: `frontend/src/lib/utils/notification-presentation.ts`
- Test: `frontend/src/lib/utils/__tests__/notification-presentation.test.ts`

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/utils/__tests__/notification-presentation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { notificationPresentation } from "@/lib/utils/notification-presentation";

describe("notificationPresentation", () => {
  it("WELCOME → Sparkle/mint", () => {
    expect(notificationPresentation("WELCOME")).toEqual({ icon: "Sparkle", tone: "mint" });
  });

  it("미지정 타입 → FALLBACK(Bell/default)", () => {
    expect(notificationPresentation("UNKNOWN_TYPE")).toEqual({ icon: "Bell", tone: "default" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- notification-presentation`
Expected: FAIL — WELCOME이 MAP에 없어 FALLBACK(Bell/default) 반환, 기대값(Sparkle/mint)과 불일치.

- [ ] **Step 3: Add WELCOME to MAP**

`notification-presentation.ts` — `MAP`의 `PASSWORD_RESET` 아래에 추가:

```ts
  PASSWORD_RESET:               { icon: "Bell",     tone: "lav"     },
  WELCOME:                      { icon: "Sparkle",  tone: "mint"    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- notification-presentation`
Expected: PASS — 두 케이스 모두 통과.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/utils/notification-presentation.ts \
        frontend/src/lib/utils/__tests__/notification-presentation.test.ts
git commit -m "feat(nc): WELCOME 알림 icon/tone 매핑 (Sparkle/mint) (B3)"
```

---

## Self-Review 결과

- **Spec coverage:** §2 아키텍처(이벤트+AFTER_COMMIT 리스너)=Task 2 · §3 변경파일 전부=Task 1~3 · §4 카피=Task 2 리스너 상수 · §5 테스트(생성·멱등)=Task 1·2 · WELCOME type+V7=Task 1 · FE meta=Task 3. **롤백 테스트는 의도적 생략** — AFTER_COMMIT 미발화는 Spring 프레임워크 보장이고, signup은 user save 후 롤백을 유발할 경로가 없어 인위적. spec §6 리스크의 "AFTER_COMMIT 테스트 발화 패턴"은 Task 2가 비-`@Transactional` + 실제 커밋으로 해소.
- **Placeholder scan:** 없음. 모든 step에 실제 코드/명령/기대출력 포함.
- **Type consistency:** `NotificationType.WELCOME`, `publishDeduped(userId, type, title, dedupKey)`, dedupKey `"WELCOME"`, `UserSignedUpEvent(Long userId)`/`event.userId()` — Task 1~2 전반 일치.
