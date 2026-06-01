# Notification Cron (PR B2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 날짜·주기 기반 알림 5종(공고 마감 D-3/D-1, 일정 D-1, 자소서 미제출, 주간 요약)을 cron 으로 생성하고 30일 지난 알림을 cleanup 한다.

**Architecture:** `notification` 모듈 집중형 — `NotificationGenerator`(@Service)가 도메인(posting/application/coverletter)을 read-only 조회 → 알림 설정 on 확인 → dedup 체크 → `NotificationProducer.publish()`. `NotificationScheduler`(@Profile("prod"), @Scheduled)가 매일 09:00 KST 호출. 개발 PC(local profile)에선 자동 실행 안 하고 `DevNotificationController`(@Profile("!prod"))로 수동 트리거.

**Tech Stack:** Spring Boot 3.5 · Java 17 · JPA · Flyway · JUnit5 · AssertJ

**Spec:** [`docs/superpowers/specs/2026-05-28-feat-noti-cron-pr-b2-design.md`](../specs/2026-05-28-feat-noti-cron-pr-b2-design.md)

---

## Profile 주의 (코드베이스 사실)

- `application.yml` 의 `spring.profiles.active = ${SPRING_PROFILES_ACTIVE:local}` — **기본 profile 은 `local`** (개발 PC).
- 따라서: scheduler 는 `@Profile("prod")` (운영에서만 자동), 수동 트리거 controller 는 `@Profile("!prod")` (local 포함 비운영 환경 전부에서 사용 가능).
- `@EnableScheduling` 이 코드베이스에 **아직 없음** → Task 8 에서 `@Profile("prod")` config 로 추가.

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `backend/src/main/resources/db/migration/V6__notification_dedup_key.sql` | create | dedup_key 컬럼 + partial unique |
| `backend/src/main/resources/db/migration/V6_R__rollback.sql` | create | 수동 rollback |
| `backend/.../notification/domain/Notification.java` | modify | `dedupKey` 필드 + `forInbox` overload |
| `backend/.../notification/repository/NotificationRepository.java` | modify | `existsByUserIdAndDedupKey`, `deleteByChannelAndCreatedAtBefore` |
| `backend/.../notification/service/NotiSettingResolver.java` | create | type→settingId 매핑 + enabled 판정 |
| `backend/.../notification/domain/NotificationType.java` | modify | `settingId()` 추가 |
| `backend/.../notification/service/NotificationProducer.java` | modify | dedup overload `publishDeduped(...)` |
| `backend/.../notification/service/NotificationService.java` | modify | `cleanup(now)` |
| `backend/.../notification/service/NotificationGenerator.java` | create | 5 type 생성 + `runDaily`/`runAll` |
| `backend/.../posting/repository/JobPostingRepository.java` | modify | `findByDeadline` |
| `backend/.../application/repository/EventRepository.java` | modify | `findScheduleEventsByDate` (Application join) |
| `backend/.../coverletter/repository/CoverLetterVariantRepository.java` | modify | `findUnsubmittedBefore` (JobPosting join) |
| `backend/.../application/repository/ApplicationRepository.java` | modify | `countByUserIdAndCreatedAtBetween` |
| `backend/.../notification/scheduler/NotificationScheduler.java` | create | `@Profile("prod")` `@Scheduled` |
| `backend/.../notification/config/SchedulingConfig.java` | create | `@EnableScheduling @Profile("prod")` |
| `backend/.../notification/controller/DevNotificationController.java` | create | `@Profile("!prod")` 수동 트리거 |
| `backend/src/test/.../notification/*` | create | unit + integration |

---

## Task 1: V6 migration + Notification.dedupKey + repository

**Files:**
- Create: `backend/src/main/resources/db/migration/V6__notification_dedup_key.sql`
- Create: `backend/src/main/resources/db/migration/V6_R__rollback.sql`
- Modify: `backend/src/main/java/com/twochi/notification/domain/Notification.java`
- Modify: `backend/src/main/java/com/twochi/notification/repository/NotificationRepository.java`
- Test: `backend/src/test/java/com/twochi/notification/NotificationRepositoryTest.java`

- [ ] **Step 1: V6 마이그레이션 작성**

Create `V6__notification_dedup_key.sql`:

```sql
ALTER TABLE notification ADD COLUMN dedup_key VARCHAR(120);

CREATE UNIQUE INDEX uq_notification_user_dedup
    ON notification (user_id, dedup_key)
    WHERE dedup_key IS NOT NULL;

COMMENT ON COLUMN notification.dedup_key IS
    'cron 멱등 키. type+참조ID(예 PD_D1:42). NULL=dedup 비대상(이벤트/수동/seeder). PR B2.';
```

Create `V6_R__rollback.sql`:

```sql
DROP INDEX IF EXISTS uq_notification_user_dedup;
ALTER TABLE notification DROP COLUMN IF EXISTS dedup_key;
```

- [ ] **Step 2: Notification 엔티티에 dedupKey 필드 + forInbox overload**

`Notification.java` — `error` 필드 아래에 컬럼 추가:

```java
    @Column(name = "dedup_key", length = 120)
    private String dedupKey;
```

private 생성자에 `dedupKey` 파라미터 추가하고 기존 `forInbox`(5-arg) 는 `dedupKey=null` 로 위임, dedup 용 6-arg overload 추가:

```java
    private Notification(Long userId, NotificationChannel channel, NotificationType type,
                         String title, String body, Instant createdAt, Instant sentAt, String dedupKey) {
        this.userId = userId;
        this.channel = channel;
        this.type = type;
        this.title = title;
        this.body = body;
        this.createdAt = createdAt;
        this.sentAt = sentAt;
        this.dedupKey = dedupKey;
    }

    public static Notification forInbox(Long userId, NotificationType type, String title, String body, Instant now) {
        return new Notification(userId, NotificationChannel.INBOX, type, title, body, now, now, null);
    }

    public static Notification forInboxDeduped(Long userId, NotificationType type, String title,
                                               String body, Instant now, String dedupKey) {
        return new Notification(userId, NotificationChannel.INBOX, type, title, body, now, now, dedupKey);
    }
```

- [ ] **Step 3: NotificationRepository 메서드 추가**

`NotificationRepository.java` 인터페이스에 추가:

```java
    boolean existsByUserIdAndDedupKey(Long userId, String dedupKey);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.channel = :channel AND n.createdAt < :cutoff")
    int deleteByChannelAndCreatedAtBefore(@Param("channel") NotificationChannel channel,
                                          @Param("cutoff") Instant cutoff);
```

- [ ] **Step 4: 실패 테스트 작성**

Create `NotificationRepositoryTest.java`:

```java
package com.twochi.notification;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.domain.NotificationChannel;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
class NotificationRepositoryTest {

    @Autowired NotificationRepository repository;

    @Test
    void dedupKey_중복_insert_는_unique_위반() {
        Instant now = Instant.now();
        repository.saveAndFlush(Notification.forInboxDeduped(1L, NotificationType.POSTING_DEADLINE_D1, "t", null, now, "PD_D1:42"));

        assertThatThrownBy(() ->
            repository.saveAndFlush(Notification.forInboxDeduped(1L, NotificationType.POSTING_DEADLINE_D1, "t2", null, now, "PD_D1:42"))
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void existsByUserIdAndDedupKey_정확히_매칭() {
        Instant now = Instant.now();
        repository.saveAndFlush(Notification.forInboxDeduped(1L, NotificationType.POSTING_DEADLINE_D1, "t", null, now, "PD_D1:42"));

        assertThat(repository.existsByUserIdAndDedupKey(1L, "PD_D1:42")).isTrue();
        assertThat(repository.existsByUserIdAndDedupKey(1L, "PD_D1:99")).isFalse();
        assertThat(repository.existsByUserIdAndDedupKey(2L, "PD_D1:42")).isFalse();
    }

    @Test
    void cleanup_은_cutoff_이전_INBOX_만_삭제() {
        Instant now = Instant.now();
        repository.saveAndFlush(Notification.forInbox(1L, NotificationType.WEEKLY_SUMMARY, "old", null, now.minus(Duration.ofDays(31))));
        repository.saveAndFlush(Notification.forInbox(1L, NotificationType.WEEKLY_SUMMARY, "fresh", null, now.minus(Duration.ofDays(29))));

        int deleted = repository.deleteByChannelAndCreatedAtBefore(NotificationChannel.INBOX, now.minus(Duration.ofDays(30)));

        assertThat(deleted).isEqualTo(1);
        assertThat(repository.count()).isEqualTo(1);
    }
}
```

- [ ] **Step 5: 테스트 실행 (실패 확인)**

Run: `cd backend && ./gradlew test --tests "com.twochi.notification.NotificationRepositoryTest"`
Expected: FAIL (dedup_key 컬럼/메서드 없음 또는 마이그레이션 미적용)

- [ ] **Step 6: 테스트 실행 (통과 확인)**

위 Step 1-3 적용 후 재실행. Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/resources/db/migration/V6__notification_dedup_key.sql \
        backend/src/main/resources/db/migration/V6_R__rollback.sql \
        backend/src/main/java/com/twochi/notification/domain/Notification.java \
        backend/src/main/java/com/twochi/notification/repository/NotificationRepository.java \
        backend/src/test/java/com/twochi/notification/NotificationRepositoryTest.java
git commit -m "feat(nc): V6 dedup_key + Notification dedup overload + cleanup repo (B2)"
```

---

## Task 2: NotificationType.settingId() + NotiSettingResolver

**Files:**
- Modify: `backend/src/main/java/com/twochi/notification/domain/NotificationType.java`
- Create: `backend/src/main/java/com/twochi/notification/service/NotiSettingResolver.java`
- Test: `backend/src/test/java/com/twochi/notification/NotiSettingResolverTest.java`

- [ ] **Step 1: NotificationType 에 settingId 매핑 추가**

`NotificationType.java` — enum 상수는 그대로 두고 메서드 추가:

```java
    /** NotiSettingDef.id 와 매핑. cron/이벤트가 사용자 설정을 조회할 때 사용. */
    public String settingId() {
        return switch (this) {
            case POSTING_DEADLINE_D3 -> "deadline-d3";
            case POSTING_DEADLINE_D1 -> "deadline-d1";
            case SCHEDULE_D1 -> "interview-d1";
            case COVER_LETTER_UNSUBMITTED_7D -> "cl-unsubmitted";
            case WEEKLY_SUMMARY -> "weekly-summary";
            case EMAIL_VERIFY -> "signup-verify";
            case PASSWORD_RESET -> "pw-reset";
        };
    }
```

- [ ] **Step 2: 실패 테스트 작성**

Create `NotiSettingResolverTest.java`:

```java
package com.twochi.notification;

import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.NotiSettingResolver;
import com.twochi.user.domain.UserNotiSetting;
import com.twochi.user.repository.UserNotiSettingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotiSettingResolverTest {

    @Mock UserNotiSettingRepository repository;
    @InjectMocks NotiSettingResolver resolver;

    @Test
    void row_없으면_defaultOn_따름() {
        // deadline-d1 defaultOn=true, cl-unsubmitted defaultOn=false
        when(repository.findByUserIdAndSettingId(1L, "deadline-d1")).thenReturn(Optional.empty());
        when(repository.findByUserIdAndSettingId(1L, "cl-unsubmitted")).thenReturn(Optional.empty());

        assertThat(resolver.isEnabled(1L, NotificationType.POSTING_DEADLINE_D1)).isTrue();
        assertThat(resolver.isEnabled(1L, NotificationType.COVER_LETTER_UNSUBMITTED_7D)).isFalse();
    }

    @Test
    void row_있으면_저장된_enabled_사용() {
        when(repository.findByUserIdAndSettingId(1L, "cl-unsubmitted"))
            .thenReturn(Optional.of(UserNotiSetting.of(1L, "cl-unsubmitted", true, Instant.now())));

        assertThat(resolver.isEnabled(1L, NotificationType.COVER_LETTER_UNSUBMITTED_7D)).isTrue();
    }
}
```

- [ ] **Step 3: 테스트 실행 (실패 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotiSettingResolverTest"`
Expected: FAIL (NotiSettingResolver 없음)

- [ ] **Step 4: NotiSettingResolver 구현**

Create `NotiSettingResolver.java`:

```java
package com.twochi.notification.service;

import com.twochi.notification.domain.NotificationType;
import com.twochi.user.domain.noti.NotiSettingDef;
import com.twochi.user.repository.UserNotiSettingRepository;
import org.springframework.stereotype.Service;

@Service
public class NotiSettingResolver {

    private final UserNotiSettingRepository repository;

    public NotiSettingResolver(UserNotiSettingRepository repository) {
        this.repository = repository;
    }

    /** 사용자가 해당 type 알림을 받기로 했는지. row 없으면 NotiSettingDef.defaultOn. */
    public boolean isEnabled(Long userId, NotificationType type) {
        String settingId = type.settingId();
        boolean defaultOn = NotiSettingDef.fromId(settingId).map(NotiSettingDef::defaultOn).orElse(false);
        return repository.findByUserIdAndSettingId(userId, settingId)
            .map(s -> s.isEnabled())
            .orElse(defaultOn);
    }
}
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotiSettingResolverTest"`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/twochi/notification/domain/NotificationType.java \
        backend/src/main/java/com/twochi/notification/service/NotiSettingResolver.java \
        backend/src/test/java/com/twochi/notification/NotiSettingResolverTest.java
git commit -m "feat(nc): NotiSettingResolver — type→settingId + defaultOn 판정 (B2)"
```

---

## Task 3: NotificationProducer.publishDeduped + NotificationService.cleanup

**Files:**
- Modify: `backend/src/main/java/com/twochi/notification/service/NotificationProducer.java`
- Modify: `backend/src/main/java/com/twochi/notification/service/NotificationService.java`
- Test: `backend/src/test/java/com/twochi/notification/NotificationProducerDedupTest.java`

- [ ] **Step 1: 실패 테스트 작성**

Create `NotificationProducerDedupTest.java`:

```java
package com.twochi.notification;

import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.notification.service.NotificationProducer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(NotificationProducer.class)
class NotificationProducerDedupTest {

    @Autowired NotificationProducer producer;
    @Autowired NotificationRepository repository;

    @Test
    void 같은_dedupKey_두번_publish_해도_한건만() {
        producer.publishDeduped(1L, NotificationType.POSTING_DEADLINE_D1, "마감 내일", "PD_D1:42");
        producer.publishDeduped(1L, NotificationType.POSTING_DEADLINE_D1, "마감 내일", "PD_D1:42");

        assertThat(repository.count()).isEqualTo(1);
    }
}
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationProducerDedupTest"`
Expected: FAIL (publishDeduped 없음)

- [ ] **Step 3: NotificationProducer 에 dedup overload 추가**

`NotificationProducer.java` 에 메서드 추가 (기존 publish 는 유지):

```java
    /**
     * dedup_key 기반 멱등 publish. 이미 같은 (userId, dedupKey) 알림이 있으면 skip.
     * existsBy 선체크 + unique 제약(동시성 안전망). cron 전용.
     */
    @Transactional
    public Notification publishDeduped(Long userId, NotificationType type, String title, String dedupKey) {
        if (repository.existsByUserIdAndDedupKey(userId, dedupKey)) {
            return null;
        }
        return repository.save(Notification.forInboxDeduped(userId, type, title, null, Instant.now(), dedupKey));
    }
```

- [ ] **Step 4: NotificationService.cleanup 추가**

`NotificationService.java` 에 메서드 추가 (기존 클래스에 `NotificationRepository repository` 주입돼 있음):

```java
    /** 30일 이전 INBOX 알림 hard delete. cron 전용. 삭제 건수 반환. */
    @Transactional
    public int cleanup(Instant now) {
        return repository.deleteByChannelAndCreatedAtBefore(
            NotificationChannel.INBOX, now.minus(Duration.ofDays(30)));
    }
```

import 추가: `import com.twochi.notification.domain.NotificationChannel; import java.time.Duration; import java.time.Instant;`

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationProducerDedupTest"`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/twochi/notification/service/NotificationProducer.java \
        backend/src/main/java/com/twochi/notification/service/NotificationService.java \
        backend/src/test/java/com/twochi/notification/NotificationProducerDedupTest.java
git commit -m "feat(nc): publishDeduped + cleanup(30d) (B2)"
```

---

## Task 4: NotificationGenerator — POSTING_DEADLINE D3/D1

**Files:**
- Modify: `backend/src/main/java/com/twochi/posting/repository/JobPostingRepository.java`
- Create: `backend/src/main/java/com/twochi/notification/service/NotificationGenerator.java`
- Test: `backend/src/test/java/com/twochi/notification/NotificationGeneratorPostingTest.java`

- [ ] **Step 1: JobPostingRepository.findByDeadline 추가**

```java
    List<JobPosting> findByDeadline(java.time.LocalDate deadline);
```

- [ ] **Step 2: 실패 테스트 작성**

Create `NotificationGeneratorPostingTest.java`:

```java
package com.twochi.notification;

import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.*;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationGeneratorPostingTest {

    @Mock JobPostingRepository jobPostingRepository;
    @Mock NotiSettingResolver settingResolver;
    @Mock NotificationProducer producer;
    @InjectMocks NotificationGenerator generator;

    @Test
    void D1_마감_공고_설정ON_이면_publish() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        JobPosting p = JobPosting.create(1L, "카카오", "백엔드", null, null, null,
            today.plusDays(1), null, new String[0], Instant.now());
        ReflectionTestUtils.setField(p, "id", 42L);
        when(jobPostingRepository.findByDeadline(today.plusDays(1))).thenReturn(List.of(p));
        when(jobPostingRepository.findByDeadline(today.plusDays(3))).thenReturn(List.of());
        when(settingResolver.isEnabled(1L, NotificationType.POSTING_DEADLINE_D1)).thenReturn(true);

        generator.generatePostingDeadline(today);

        verify(producer).publishDeduped(eq(1L), eq(NotificationType.POSTING_DEADLINE_D1),
            contains("마감이 내일"), eq("PD_D1:42"));
    }

    @Test
    void 설정OFF_면_skip() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        JobPosting p = JobPosting.create(1L, "카카오", "백엔드", null, null, null,
            today.plusDays(1), null, new String[0], Instant.now());
        ReflectionTestUtils.setField(p, "id", 42L);
        when(jobPostingRepository.findByDeadline(today.plusDays(1))).thenReturn(List.of(p));
        when(jobPostingRepository.findByDeadline(today.plusDays(3))).thenReturn(List.of());
        when(settingResolver.isEnabled(1L, NotificationType.POSTING_DEADLINE_D1)).thenReturn(false);

        generator.generatePostingDeadline(today);

        verify(producer, never()).publishDeduped(anyLong(), any(), any(), any());
    }
}
```

> 주의: `JobPosting.create(...)` 의 실제 시그니처는 `JobPosting.java` 에서 확인 후 인자 순서를 맞출 것. id 는 `ReflectionTestUtils.setField` 로 주입.

- [ ] **Step 3: 테스트 실행 (실패 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationGeneratorPostingTest"`
Expected: FAIL (NotificationGenerator 없음)

- [ ] **Step 4: NotificationGenerator 생성 (POSTING 부분)**

Create `NotificationGenerator.java`:

```java
package com.twochi.notification.service;

import com.twochi.notification.domain.NotificationType;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class NotificationGenerator {

    private final JobPostingRepository jobPostingRepository;
    private final NotiSettingResolver settingResolver;
    private final NotificationProducer producer;

    public NotificationGenerator(JobPostingRepository jobPostingRepository,
                                 NotiSettingResolver settingResolver,
                                 NotificationProducer producer) {
        this.jobPostingRepository = jobPostingRepository;
        this.settingResolver = settingResolver;
        this.producer = producer;
    }

    public void generatePostingDeadline(LocalDate today) {
        for (JobPosting p : jobPostingRepository.findByDeadline(today.plusDays(3))) {
            if (settingResolver.isEnabled(p.getUserId(), NotificationType.POSTING_DEADLINE_D3)) {
                producer.publishDeduped(p.getUserId(), NotificationType.POSTING_DEADLINE_D3,
                    "%s %s 마감이 3일 남았어요".formatted(p.getCompany(), p.getTitle()),
                    "PD_D3:" + p.getId());
            }
        }
        for (JobPosting p : jobPostingRepository.findByDeadline(today.plusDays(1))) {
            if (settingResolver.isEnabled(p.getUserId(), NotificationType.POSTING_DEADLINE_D1)) {
                producer.publishDeduped(p.getUserId(), NotificationType.POSTING_DEADLINE_D1,
                    "%s %s 마감이 내일이에요".formatted(p.getCompany(), p.getTitle()),
                    "PD_D1:" + p.getId());
            }
        }
    }
}
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationGeneratorPostingTest"`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/twochi/posting/repository/JobPostingRepository.java \
        backend/src/main/java/com/twochi/notification/service/NotificationGenerator.java \
        backend/src/test/java/com/twochi/notification/NotificationGeneratorPostingTest.java
git commit -m "feat(nc): NotificationGenerator — 공고 마감 D-3/D-1 (B2)"
```

---

## Task 5: NotificationGenerator — SCHEDULE_D1

**Files:**
- Modify: `backend/src/main/java/com/twochi/application/repository/EventRepository.java`
- Modify: `backend/src/main/java/com/twochi/notification/service/NotificationGenerator.java`
- Test: `backend/src/test/java/com/twochi/notification/NotificationGeneratorScheduleTest.java`

- [ ] **Step 1: EventRepository 에 일정 조회 추가 (Application join projection)**

`EventRepository.java` — Event + Application 의 userId/company 를 함께 가져오는 projection 쿼리:

```java
    @Query("""
        SELECT e.id AS eventId, e.type AS type, a.userId AS userId, a.company AS company
        FROM Event e JOIN Application a ON e.applicationId = a.id
        WHERE e.eventDate = :date
          AND e.type IN (com.twochi.application.domain.EventType.DOC_DEADLINE,
                         com.twochi.application.domain.EventType.CODING_TEST,
                         com.twochi.application.domain.EventType.FIRST_INTERVIEW,
                         com.twochi.application.domain.EventType.SECOND_INTERVIEW,
                         com.twochi.application.domain.EventType.EXEC_INTERVIEW,
                         com.twochi.application.domain.EventType.NEGOTIATION)
    """)
    List<ScheduleRow> findScheduleEventsByDate(java.time.LocalDate date);

    interface ScheduleRow {
        Long getEventId();
        com.twochi.application.domain.EventType getType();
        Long getUserId();
        String getCompany();
    }
```

- [ ] **Step 2: 실패 테스트 작성**

Create `NotificationGeneratorScheduleTest.java`:

```java
package com.twochi.notification;

import com.twochi.application.domain.EventType;
import com.twochi.application.repository.EventRepository;
import com.twochi.application.repository.EventRepository.ScheduleRow;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationGeneratorScheduleTest {

    @Mock EventRepository eventRepository;
    @Mock NotiSettingResolver settingResolver;
    @Mock NotificationProducer producer;
    @InjectMocks NotificationGenerator generator;

    private ScheduleRow row(Long eventId, EventType type, Long userId, String company) {
        return new ScheduleRow() {
            public Long getEventId() { return eventId; }
            public EventType getType() { return type; }
            public Long getUserId() { return userId; }
            public String getCompany() { return company; }
        };
    }

    @Test
    void 내일_면접일정_설정ON_이면_publish() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        when(eventRepository.findScheduleEventsByDate(today.plusDays(1)))
            .thenReturn(List.of(row(7L, EventType.FIRST_INTERVIEW, 1L, "테크컴퍼니")));
        when(settingResolver.isEnabled(1L, NotificationType.SCHEDULE_D1)).thenReturn(true);

        generator.generateScheduleD1(today);

        verify(producer).publishDeduped(eq(1L), eq(NotificationType.SCHEDULE_D1),
            contains("1차 면접"), eq("SCH_D1:7"));
    }
}
```

- [ ] **Step 3: 테스트 실행 (실패 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationGeneratorScheduleTest"`
Expected: FAIL (generateScheduleD1 없음)

- [ ] **Step 4: NotificationGenerator 에 SCHEDULE_D1 + EventType 한글 매핑 추가**

`NotificationGenerator.java` — `EventRepository` 주입 추가하고 메서드 추가:

```java
    // 생성자에 EventRepository eventRepository 추가 + 필드 저장

    private static String eventTypeLabel(com.twochi.application.domain.EventType type) {
        return switch (type) {
            case DOC_DEADLINE -> "서류 마감";
            case CODING_TEST -> "코딩테스트";
            case FIRST_INTERVIEW -> "1차 면접";
            case SECOND_INTERVIEW -> "2차 면접";
            case EXEC_INTERVIEW -> "임원 면접";
            case NEGOTIATION -> "처우 협상";
            default -> "일정";
        };
    }

    public void generateScheduleD1(LocalDate today) {
        for (var r : eventRepository.findScheduleEventsByDate(today.plusDays(1))) {
            if (settingResolver.isEnabled(r.getUserId(), NotificationType.SCHEDULE_D1)) {
                producer.publishDeduped(r.getUserId(), NotificationType.SCHEDULE_D1,
                    "%s %s 일정이 내일이에요".formatted(r.getCompany(), eventTypeLabel(r.getType())),
                    "SCH_D1:" + r.getEventId());
            }
        }
    }
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationGeneratorScheduleTest"`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/twochi/application/repository/EventRepository.java \
        backend/src/main/java/com/twochi/notification/service/NotificationGenerator.java \
        backend/src/test/java/com/twochi/notification/NotificationGeneratorScheduleTest.java
git commit -m "feat(nc): NotificationGenerator — 일정 D-1 (면접·코테 등) (B2)"
```

---

## Task 6: NotificationGenerator — COVER_LETTER_UNSUBMITTED_7D

**Files:**
- Modify: `backend/src/main/java/com/twochi/coverletter/repository/CoverLetterVariantRepository.java`
- Modify: `backend/src/main/java/com/twochi/notification/service/NotificationGenerator.java`
- Test: `backend/src/test/java/com/twochi/notification/NotificationGeneratorCoverLetterTest.java`

- [ ] **Step 1: CoverLetterVariantRepository 에 미제출 조회 추가 (JobPosting join)**

```java
    @Query("""
        SELECT v.id AS variantId, v.userId AS userId, p.company AS company
        FROM CoverLetterVariant v JOIN JobPosting p ON v.postingId = p.id
        WHERE v.status = com.twochi.coverletter.domain.CoverLetterVariant.Status.DRAFT
          AND v.deletedAt IS NULL
          AND v.postingId IS NOT NULL
          AND p.deadline >= :today
          AND v.updatedAt <= :staleBefore
    """)
    List<UnsubmittedRow> findUnsubmittedBefore(java.time.LocalDate today, java.time.Instant staleBefore);

    interface UnsubmittedRow {
        Long getVariantId();
        Long getUserId();
        String getCompany();
    }
```

- [ ] **Step 2: 실패 테스트 작성**

Create `NotificationGeneratorCoverLetterTest.java`:

```java
package com.twochi.notification;

import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.coverletter.repository.CoverLetterVariantRepository.UnsubmittedRow;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationGeneratorCoverLetterTest {

    @Mock CoverLetterVariantRepository variantRepository;
    @Mock NotiSettingResolver settingResolver;
    @Mock NotificationProducer producer;
    @InjectMocks NotificationGenerator generator;

    private UnsubmittedRow row(Long id, Long userId, String company) {
        return new UnsubmittedRow() {
            public Long getVariantId() { return id; }
            public Long getUserId() { return userId; }
            public String getCompany() { return company; }
        };
    }

    @Test
    void 마감전_방치_DRAFT_설정ON_이면_publish() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        when(variantRepository.findUnsubmittedBefore(eq(today), any()))
            .thenReturn(List.of(row(15L, 1L, "네이버")));
        when(settingResolver.isEnabled(1L, NotificationType.COVER_LETTER_UNSUBMITTED_7D)).thenReturn(true);

        generator.generateCoverLetterUnsubmitted(today);

        verify(producer).publishDeduped(eq(1L), eq(NotificationType.COVER_LETTER_UNSUBMITTED_7D),
            contains("마감 전에"), eq("CL7:15"));
    }
}
```

- [ ] **Step 3: 테스트 실행 (실패 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationGeneratorCoverLetterTest"`
Expected: FAIL (generateCoverLetterUnsubmitted 없음)

- [ ] **Step 4: NotificationGenerator 에 CL_UNSUBMITTED 추가**

`NotificationGenerator.java` — `CoverLetterVariantRepository` 주입 추가하고:

```java
    public void generateCoverLetterUnsubmitted(LocalDate today) {
        java.time.Instant staleBefore = today.atStartOfDay(java.time.ZoneId.of("Asia/Seoul"))
            .minusDays(7).toInstant();
        for (var r : variantRepository.findUnsubmittedBefore(today, staleBefore)) {
            if (settingResolver.isEnabled(r.getUserId(), NotificationType.COVER_LETTER_UNSUBMITTED_7D)) {
                producer.publishDeduped(r.getUserId(), NotificationType.COVER_LETTER_UNSUBMITTED_7D,
                    "%s 자소서가 아직 작성 중이에요. 마감 전에 마무리해볼까요?".formatted(r.getCompany()),
                    "CL7:" + r.getVariantId());
            }
        }
    }
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationGeneratorCoverLetterTest"`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/twochi/coverletter/repository/CoverLetterVariantRepository.java \
        backend/src/main/java/com/twochi/notification/service/NotificationGenerator.java \
        backend/src/test/java/com/twochi/notification/NotificationGeneratorCoverLetterTest.java
git commit -m "feat(nc): NotificationGenerator — 자소서 미제출(마감전 7일방치) (B2)"
```

---

## Task 7: NotificationGenerator — WEEKLY_SUMMARY

**Files:**
- Modify: `backend/src/main/java/com/twochi/application/repository/ApplicationRepository.java`
- Modify: `backend/src/main/java/com/twochi/coverletter/repository/CoverLetterVariantRepository.java`
- Modify: `backend/src/main/java/com/twochi/notification/service/NotificationGenerator.java`
- Test: `backend/src/test/java/com/twochi/notification/NotificationGeneratorWeeklyTest.java`

> 대상 사용자 = "온보딩 완료한 전체 사용자". `UserRepository` 에서 `findByOnboardingCompletedTrue()` 조회 (없으면 추가). 각 사용자별 지난주 집계.

- [ ] **Step 1: 집계 카운트 쿼리 추가**

`ApplicationRepository.java`:

```java
    long countByUserIdAndCreatedAtBetween(Long userId, java.time.Instant from, java.time.Instant to);
```

`CoverLetterVariantRepository.java`:

```java
    long countByUserIdAndStatusAndUpdatedAtBetweenAndDeletedAtIsNull(
        Long userId, com.twochi.coverletter.domain.CoverLetterVariant.Status status,
        java.time.Instant from, java.time.Instant to);
```

`UserRepository.java` (없으면 추가):

```java
    List<User> findByOnboardingCompletedTrue();
```

> `User` 엔티티의 onboarding 완료 필드명은 `User.java` 에서 확인 (예: `onboardingCompleted`). 다르면 메서드명 맞출 것.

- [ ] **Step 2: 실패 테스트 작성**

Create `NotificationGeneratorWeeklyTest.java`:

```java
package com.twochi.notification;

import com.twochi.application.repository.ApplicationRepository;
import com.twochi.coverletter.domain.CoverLetterVariant.Status;
import com.twochi.coverletter.repository.CoverLetterVariantRepository;
import com.twochi.notification.domain.NotificationType;
import com.twochi.notification.service.*;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationGeneratorWeeklyTest {

    @Mock UserRepository userRepository;
    @Mock ApplicationRepository applicationRepository;
    @Mock CoverLetterVariantRepository variantRepository;
    @Mock NotiSettingResolver settingResolver;
    @Mock NotificationProducer producer;
    @InjectMocks NotificationGenerator generator;

    @Test
    void 지난주_활동있고_설정ON_이면_수치_title_publish() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        User u = mock(User.class);
        when(u.getId()).thenReturn(1L);
        when(userRepository.findByOnboardingCompletedTrue()).thenReturn(List.of(u));
        when(applicationRepository.countByUserIdAndCreatedAtBetween(eq(1L), any(), any())).thenReturn(2L);
        when(variantRepository.countByUserIdAndStatusAndUpdatedAtBetweenAndDeletedAtIsNull(eq(1L), eq(Status.DRAFT), any(), any())).thenReturn(3L);
        when(settingResolver.isEnabled(1L, NotificationType.WEEKLY_SUMMARY)).thenReturn(true);

        generator.generateWeeklySummary(today);

        verify(producer).publishDeduped(eq(1L), eq(NotificationType.WEEKLY_SUMMARY),
            contains("지원 2건"), eq("WK:1:2026-W22"));
    }

    @Test
    void 지난주_활동0건_이면_skip() {
        LocalDate today = LocalDate.of(2026, 5, 28);
        User u = mock(User.class);
        when(u.getId()).thenReturn(1L);
        when(userRepository.findByOnboardingCompletedTrue()).thenReturn(List.of(u));
        when(applicationRepository.countByUserIdAndCreatedAtBetween(eq(1L), any(), any())).thenReturn(0L);
        when(variantRepository.countByUserIdAndStatusAndUpdatedAtBetweenAndDeletedAtIsNull(eq(1L), eq(Status.DRAFT), any(), any())).thenReturn(0L);

        generator.generateWeeklySummary(today);

        verify(producer, never()).publishDeduped(anyLong(), any(), any(), any());
    }
}
```

> ISO 주차 포맷: `today` 가 2026-05-28(목)이면 해당 주의 ISO week 를 `WK:{userId}:{IsoWeekString}` 로. 구현에서 `java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR` + `WEEK_BASED_YEAR` 사용. 테스트의 `2026-W22` 는 구현 후 실제 값으로 맞출 것.

- [ ] **Step 3: 테스트 실행 (실패 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationGeneratorWeeklyTest"`
Expected: FAIL (generateWeeklySummary 없음)

- [ ] **Step 4: NotificationGenerator 에 WEEKLY_SUMMARY 추가**

```java
    // 생성자에 UserRepository, ApplicationRepository 주입 추가

    public void generateWeeklySummary(LocalDate today) {
        java.time.ZoneId kst = java.time.ZoneId.of("Asia/Seoul");
        java.time.Instant to = today.atStartOfDay(kst).toInstant();
        java.time.Instant from = today.minusDays(7).atStartOfDay(kst).toInstant();
        int week = today.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        int weekYear = today.get(java.time.temporal.IsoFields.WEEK_BASED_YEAR);
        String isoWeek = "%d-W%02d".formatted(weekYear, week);

        for (User u : userRepository.findByOnboardingCompletedTrue()) {
            long applied = applicationRepository.countByUserIdAndCreatedAtBetween(u.getId(), from, to);
            long drafts = variantRepository
                .countByUserIdAndStatusAndUpdatedAtBetweenAndDeletedAtIsNull(
                    u.getId(), CoverLetterVariant.Status.DRAFT, from, to);
            if (applied == 0 && drafts == 0) continue;            // 빈 요약 생략
            if (!settingResolver.isEnabled(u.getId(), NotificationType.WEEKLY_SUMMARY)) continue;
            producer.publishDeduped(u.getId(), NotificationType.WEEKLY_SUMMARY,
                "이번 주 지원 %d건·자소서 초안 %d건을 정리했어요".formatted(applied, drafts),
                "WK:" + u.getId() + ":" + isoWeek);
        }
    }
```

import: `com.twochi.user.domain.User`, `com.twochi.user.repository.UserRepository`, `com.twochi.application.repository.ApplicationRepository`, `com.twochi.coverletter.domain.CoverLetterVariant`, `com.twochi.coverletter.repository.CoverLetterVariantRepository`.

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationGeneratorWeeklyTest"`
Expected: PASS (2 tests) — `2026-W22` 가 틀리면 실제 출력값으로 테스트 수정 후 통과

- [ ] **Step 6: runDaily / runAll 묶음 메서드 추가**

`NotificationGenerator.java` 끝에:

```java
    /** 매일 도는 알림 (스케줄러용). cleanup 은 스케줄러가 NotificationService 로 별도 호출. */
    public void runDaily(LocalDate today) {
        generatePostingDeadline(today);
        generateScheduleD1(today);
        generateCoverLetterUnsubmitted(today);
        if (today.getDayOfWeek() == java.time.DayOfWeek.MONDAY) {
            generateWeeklySummary(today);
        }
    }
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/twochi/application/repository/ApplicationRepository.java \
        backend/src/main/java/com/twochi/coverletter/repository/CoverLetterVariantRepository.java \
        backend/src/main/java/com/twochi/user/repository/UserRepository.java \
        backend/src/main/java/com/twochi/notification/service/NotificationGenerator.java \
        backend/src/test/java/com/twochi/notification/NotificationGeneratorWeeklyTest.java
git commit -m "feat(nc): NotificationGenerator — 주간 요약 + runDaily 묶음 (B2)"
```

---

## Task 8: NotificationScheduler + @EnableScheduling (prod)

**Files:**
- Create: `backend/src/main/java/com/twochi/notification/config/SchedulingConfig.java`
- Create: `backend/src/main/java/com/twochi/notification/scheduler/NotificationScheduler.java`
- Test: `backend/src/test/java/com/twochi/notification/NotificationSchedulerTest.java`

- [ ] **Step 1: SchedulingConfig 작성**

Create `SchedulingConfig.java`:

```java
package com.twochi.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

/** cron 은 운영(prod)에서만 자동 실행. local/dev/test 는 DevNotificationController 로 수동 트리거. */
@Configuration
@Profile("prod")
@EnableScheduling
public class SchedulingConfig {
}
```

- [ ] **Step 2: 실패 테스트 작성**

Create `NotificationSchedulerTest.java`:

```java
package com.twochi.notification;

import com.twochi.notification.scheduler.NotificationScheduler;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationSchedulerTest {

    @Mock NotificationGenerator generator;
    @Mock NotificationService service;
    @InjectMocks NotificationScheduler scheduler;

    @Test
    void daily_실행시_generator_runDaily_와_cleanup_호출() {
        scheduler.runDailyCron();

        verify(generator).runDaily(any(LocalDate.class));
        verify(service).cleanup(any());
    }
}
```

- [ ] **Step 3: 테스트 실행 (실패 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationSchedulerTest"`
Expected: FAIL (NotificationScheduler 없음)

- [ ] **Step 4: NotificationScheduler 작성**

Create `NotificationScheduler.java`:

```java
package com.twochi.notification.scheduler;

import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationService;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Component
@Profile("prod")
public class NotificationScheduler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final NotificationGenerator generator;
    private final NotificationService service;

    public NotificationScheduler(NotificationGenerator generator, NotificationService service) {
        this.generator = generator;
        this.service = service;
    }

    /** 매일 09:00 KST — 일별 알림(+월요일 주간) 생성 후 30일 cleanup. */
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void runDailyCron() {
        generator.runDaily(LocalDate.now(KST));
        service.cleanup(Instant.now());
    }
}
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationSchedulerTest"`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/twochi/notification/config/SchedulingConfig.java \
        backend/src/main/java/com/twochi/notification/scheduler/NotificationScheduler.java \
        backend/src/test/java/com/twochi/notification/NotificationSchedulerTest.java
git commit -m "feat(nc): NotificationScheduler + @EnableScheduling (prod only) (B2)"
```

---

## Task 9: DevNotificationController (!prod 수동 트리거)

**Files:**
- Create: `backend/src/main/java/com/twochi/notification/controller/DevNotificationController.java`
- Test: `backend/src/test/java/com/twochi/notification/DevNotificationControllerTest.java`

- [ ] **Step 1: DevNotificationController 작성**

Create `DevNotificationController.java`:

```java
package com.twochi.notification.controller;

import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationService;
import org.springframework.context.annotation.Profile;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/** cron 로직 수동 트리거 (개발/QA). prod 에선 미등록. */
@RestController
@RequestMapping("/api/v1/dev/notifications")
@Profile("!prod")
public class DevNotificationController {

    private final NotificationGenerator generator;
    private final NotificationService service;

    public DevNotificationController(NotificationGenerator generator, NotificationService service) {
        this.generator = generator;
        this.service = service;
    }

    @PostMapping("/run-cron")
    public ResponseEntity<Void> runCron(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now(ZoneId.of("Asia/Seoul"));
        generator.runDaily(target);
        service.cleanup(Instant.now());
        return ResponseEntity.ok().build();
    }
}
```

- [ ] **Step 2: 실패 테스트 작성 (@WebMvcTest, dev profile)**

Create `DevNotificationControllerTest.java`:

```java
package com.twochi.notification;

import com.twochi.notification.controller.DevNotificationController;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DevNotificationController.class)
@ActiveProfiles("dev")
class DevNotificationControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean NotificationGenerator generator;
    @MockitoBean NotificationService service;

    @Test
    void run_cron_은_date_파라미터로_generator_호출() throws Exception {
        mvc.perform(post("/api/v1/dev/notifications/run-cron").param("date", "2026-05-28"))
            .andExpect(status().isOk());

        verify(generator).runDaily(LocalDate.of(2026, 5, 28));
        verify(service).cleanup(org.mockito.ArgumentMatchers.any());
    }
}
```

> 보안 주의: 이 엔드포인트가 Spring Security 필터에 막히면 테스트/수동호출이 401. `SecurityConfig` 에서 `/api/v1/dev/**` 를 dev profile 한정 permitAll 로 열어야 할 수 있음 — Task 9 Step 3 에서 확인.

- [ ] **Step 3: SecurityConfig 확인/조정**

`backend/.../config/SecurityConfig.java` (또는 auth 모듈) 에서 인증 없이 호출 가능하도록 dev 엔드포인트 허용 여부 확인. 기존 패턴을 따라 `/api/v1/dev/**` 를 permitAll 추가 (이미 인증 면제 경로 패턴이 있으면 거기 합류). 변경 시 해당 SecurityConfig 테스트도 함께 갱신.

- [ ] **Step 4: 테스트 실행 (통과 확인)**

Run: `./gradlew test --tests "com.twochi.notification.DevNotificationControllerTest"`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/twochi/notification/controller/DevNotificationController.java \
        backend/src/test/java/com/twochi/notification/DevNotificationControllerTest.java
git commit -m "feat(nc): DevNotificationController — cron 수동 트리거 (!prod) (B2)"
```

---

## Task 10: 통합 테스트 — dedup 멱등 + cleanup + dev 트리거 end-to-end

**Files:**
- Test: `backend/src/test/java/com/twochi/notification/NotificationCronIntegrationTest.java`

- [ ] **Step 1: 통합 테스트 작성 (@SpringBootTest, dev profile)**

실제 DB(Flyway V6 적용) + 전체 빈으로 cron 을 2회 실행해 멱등성을 증명한다. 사전 데이터: 마감 D-1 공고 1건(설정 default ON) 저장 후 `DevNotificationController` 또는 `NotificationGenerator.runDaily` 2회.

```java
package com.twochi.notification;

import com.twochi.notification.domain.NotificationChannel;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.notification.service.NotificationGenerator;
import com.twochi.posting.domain.JobPosting;
import com.twochi.posting.repository.JobPostingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
class NotificationCronIntegrationTest {

    @Autowired JobPostingRepository jobPostingRepository;
    @Autowired NotificationGenerator generator;
    @Autowired NotificationRepository notificationRepository;

    @Test
    void cron_2회_실행해도_같은_공고_알림은_1건() {
        LocalDate today = LocalDate.now();
        // 마감 내일(D-1) 공고. userId=1 (설정 row 없음 → deadline-d1 defaultOn=true)
        jobPostingRepository.saveAndFlush(JobPosting.create(
            1L, "카카오", "백엔드", null, null, null, today.plusDays(1), null, new String[0], Instant.now()));

        generator.generatePostingDeadline(today);
        long after1 = notificationRepository.count();
        generator.generatePostingDeadline(today);
        long after2 = notificationRepository.count();

        assertThat(after1).isEqualTo(1);
        assertThat(after2).isEqualTo(1);  // 멱등: 중복 0
    }
}
```

> `JobPosting.create(...)` 인자 순서는 실제 시그니처에 맞출 것. 통합 테스트는 테스트 DB(Postgres 또는 Testcontainers) 설정에 따라 `@ActiveProfiles`/datasource 가 기존 IntegrationTest 패턴(`NotificationIntegrationTest`)을 따라야 함 — 그 파일을 참고해 동일 셋업 적용.

- [ ] **Step 2: 테스트 실행 (통과 확인)**

Run: `./gradlew test --tests "com.twochi.notification.NotificationCronIntegrationTest"`
Expected: PASS — after1=1, after2=1

- [ ] **Step 3: 전체 테스트 + 빌드**

Run: `./gradlew test` → 전체 그린 확인
Run: `./gradlew build` → 컴파일·패키징 성공

- [ ] **Step 4: Commit**

```bash
git add backend/src/test/java/com/twochi/notification/NotificationCronIntegrationTest.java
git commit -m "test(nc): cron 멱등 통합 테스트 (dedup 2회 실행) (B2)"
```

---

## 마무리 체크리스트

- [ ] `spec §6` 의 `@Profile("dev")` 표기를 실제 구현(`scheduler=@Profile("prod")`, `controller=@Profile("!prod")`)에 맞게 spec 한 줄 정정 (또는 plan 이 정본임을 명시)
- [ ] `./gradlew test` 전체 그린
- [ ] `./gradlew build` 성공
- [ ] PR 생성 시 dev 수동 검증 방법 기재: `SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun` 후 `curl -X POST "localhost:8080/api/v1/dev/notifications/run-cron?date=YYYY-MM-DD"` → mypage 알림센터 확인
