# `feat/noti-center-pr-b1` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mypage 알림 센터 (`/mypage/notification-center`) 의 mock 을 실 데이터로 wiring — notification 테이블 + 3 endpoint + FE view refactor + TopNav bell navigation + dev seed.

**Architecture:**
신규 `com.twochi.notification` BE 패키지 (entity / repo / service / producer / controller / dto / seeder). Spring `@Profile("dev")` seeder 가 첫 사용자에게 6개 sample insert. FE `NotiCenterView` self-fetching + bulk actions (mark-all-read, delete-all). DeleteAllConfirmModal (PR A 패턴). PR B2 (cron) / PR B3 (event producer) 가 의존할 `NotificationProducer.publish(userId, icon, tone, message)` API 정의.

**Tech Stack:** Spring Boot 3.5.6 · Java 17 · JPA · Flyway · Next.js · React · TypeScript · Vitest

**Spec:** [`docs/superpowers/specs/2026-05-27-feat-noti-center-pr-b1-design.md`](../specs/2026-05-27-feat-noti-center-pr-b1-design.md)

---

## File Structure

| 파일 | 변경 | 한 줄 책임 |
|---|---|---|
| `backend/src/main/resources/db/migration/V5__notification.sql` | create | notification 테이블 + 인덱스 + 코멘트 |
| `backend/src/main/resources/db/migration/V5_R__rollback.sql` | create | 수동 rollback (DROP TABLE) |
| `backend/src/main/java/com/twochi/notification/domain/Notification.java` | create | 엔티티 + `of()` 정적 팩토리 + `markRead(now)` |
| `backend/src/main/java/com/twochi/notification/repository/NotificationRepository.java` | create | `findByUserId...After` / `markAllReadByUserId` `@Modifying` / `deleteAllByUserId` `@Modifying` |
| `backend/src/main/java/com/twochi/notification/service/NotificationService.java` | create | `@Transactional` — list/markAllRead/deleteAll. 30일 cutoff 강제 |
| `backend/src/main/java/com/twochi/notification/service/NotificationProducer.java` | create | `publish(userId, icon, tone, message)` — future-facing API |
| `backend/src/main/java/com/twochi/notification/controller/NotificationController.java` | create | 3 endpoint |
| `backend/src/main/java/com/twochi/notification/dto/NotificationItemResponse.java` | create | record |
| `backend/src/main/java/com/twochi/notification/dto/NotificationListResponse.java` | create | record |
| `backend/src/main/java/com/twochi/notification/seed/NotificationSeeder.java` | create | `@Profile("dev")` + idempotent seed |
| `backend/src/test/java/com/twochi/notification/NotificationServiceTest.java` | create | unit tests |
| `backend/src/test/java/com/twochi/notification/NotificationIntegrationTest.java` | create | controller end-to-end |
| `frontend/src/lib/types/notification.ts` | create | DTO types |
| `frontend/src/lib/api/notification.ts` | create | 3 함수 |
| `frontend/src/components/mypage/delete-all-confirm-modal.tsx` | create | modal (PR A 패턴) |
| `frontend/src/components/mypage/__tests__/delete-all-confirm-modal.test.tsx` | create | 4 tests |
| `frontend/src/components/mypage/noti-center-view.tsx` | modify | props 제거 → self-fetching + bulk actions |
| `frontend/src/components/mypage/__tests__/noti-center-view.test.tsx` | modify | 전체 교체 |
| `frontend/src/app/(app)/mypage/notification-center/page.tsx` | modify | `<NotiCenterView />` (no props) |
| `frontend/src/lib/mock/mypage.ts` | modify | `NotiCenterEntry` + `NOTI_CENTER_MOCK` 제거 |
| `frontend/src/components/app-shell/top-nav.tsx` | modify | BellIcon click → router.push |
| `frontend/src/components/app-shell/__tests__/top-nav.test.tsx` | modify | navigation test 추가 |

---

## Task 1: 브랜치 + V5 마이그레이션 + Notification 엔티티 + Repository

**Files:**
- Create: `backend/src/main/resources/db/migration/V5__notification.sql`
- Create: `backend/src/main/resources/db/migration/V5_R__rollback.sql`
- Create: `backend/src/main/java/com/twochi/notification/domain/Notification.java`
- Create: `backend/src/main/java/com/twochi/notification/repository/NotificationRepository.java`

- [ ] **Step 1: develop 동기화 + 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop
git pull origin develop
git checkout -b feat/noti-center-pr-b1
```

Expected: `Switched to a new branch 'feat/noti-center-pr-b1'`

- [ ] **Step 2: V5 마이그레이션 작성**

Create `backend/src/main/resources/db/migration/V5__notification.sql`:

```sql
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

Create `backend/src/main/resources/db/migration/V5_R__rollback.sql`:

```sql
-- V5 rollback (manual). Flyway 자동 실행 안 함.
DROP TABLE IF EXISTS notification;
```

- [ ] **Step 3: Notification 엔티티 작성**

Create `backend/src/main/java/com/twochi/notification/domain/Notification.java`:

```java
package com.twochi.notification.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "notification")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String icon;

    @Column(name = "icon_tone", nullable = false, length = 10)
    private String iconTone;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "read_at")
    private Instant readAt;

    private Notification(Long userId, String icon, String iconTone, String message, Instant createdAt) {
        this.userId = userId;
        this.icon = icon;
        this.iconTone = iconTone;
        this.message = message;
        this.createdAt = createdAt;
    }

    public static Notification of(Long userId, String icon, String iconTone, String message, Instant createdAt) {
        return new Notification(userId, icon, iconTone, message, createdAt);
    }

    public void markRead(Instant now) {
        if (this.readAt == null) {
            this.readAt = now;
        }
    }
}
```

- [ ] **Step 4: NotificationRepository 작성**

Create `backend/src/main/java/com/twochi/notification/repository/NotificationRepository.java`:

```java
package com.twochi.notification.repository;

import com.twochi.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(Long userId, Instant since);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :now WHERE n.userId = :userId AND n.readAt IS NULL")
    int markAllReadByUserId(@Param("userId") Long userId, @Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
```

- [ ] **Step 5: 컴파일 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: 전체 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test 2>&1 | tail -5
```

Expected: BUILD SUCCESSFUL. 기존 테스트 회귀 0 (V5 마이그레이션이 처음 실행됨).

- [ ] **Step 7: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/resources/db/migration/V5__notification.sql \
    backend/src/main/resources/db/migration/V5_R__rollback.sql \
    backend/src/main/java/com/twochi/notification/domain/Notification.java \
    backend/src/main/java/com/twochi/notification/repository/NotificationRepository.java
git commit -m "$(cat <<'EOF'
feat(nc): V5 migration + Notification 엔티티 + repository

- V5 마이그레이션: notification 테이블 + (user_id, created_at DESC) 복합 인덱스 + 코멘트
- Notification 엔티티: (userId, icon, iconTone, message, createdAt, readAt). of() 팩토리 + markRead(now)
- NotificationRepository: findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc (30일 filter 강제용)
  + markAllReadByUserId / deleteAllByUserId @Modifying

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: NotificationService + NotificationProducer + unit tests

**Files:**
- Create: `backend/src/main/java/com/twochi/notification/service/NotificationService.java`
- Create: `backend/src/main/java/com/twochi/notification/service/NotificationProducer.java`
- Create: `backend/src/test/java/com/twochi/notification/NotificationServiceTest.java`

- [ ] **Step 1: 실패하는 unit tests 먼저**

Create `backend/src/test/java/com/twochi/notification/NotificationServiceTest.java`:

```java
package com.twochi.notification;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.notification.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class NotificationServiceTest {

    @Autowired private NotificationService service;
    @Autowired private NotificationRepository repository;

    private static final long USER_ID = 9999L;
    private static final long OTHER_USER = 8888L;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        repository.deleteAll();
    }

    @Test
    void list_filtersOut30DaysAgo() {
        Instant now = Instant.now();
        repository.save(Notification.of(USER_ID, "Bell", "warn", "최근", now.minus(Duration.ofDays(5))));
        repository.save(Notification.of(USER_ID, "Bell", "warn", "31일전", now.minus(Duration.ofDays(31))));

        var result = service.list(USER_ID);

        assertThat(result.notifications()).hasSize(1);
        assertThat(result.notifications().get(0).message()).isEqualTo("최근");
    }

    @Test
    void list_orderedByCreatedAtDesc() {
        Instant now = Instant.now();
        repository.save(Notification.of(USER_ID, "Bell", "warn", "오래된", now.minus(Duration.ofHours(10))));
        repository.save(Notification.of(USER_ID, "Bell", "warn", "최신", now.minus(Duration.ofHours(1))));

        var result = service.list(USER_ID);

        assertThat(result.notifications()).hasSize(2);
        assertThat(result.notifications().get(0).message()).isEqualTo("최신");
        assertThat(result.notifications().get(1).message()).isEqualTo("오래된");
    }

    @Test
    void list_otherUsersExcluded() {
        Instant now = Instant.now();
        repository.save(Notification.of(USER_ID, "Bell", "warn", "내것", now));
        repository.save(Notification.of(OTHER_USER, "Bell", "warn", "남것", now));

        var result = service.list(USER_ID);

        assertThat(result.notifications()).hasSize(1);
        assertThat(result.notifications().get(0).message()).isEqualTo("내것");
    }

    @Test
    void markAllRead_setsReadAtForUnreadOnly() {
        Instant now = Instant.now();
        Notification unread = repository.save(Notification.of(USER_ID, "Bell", "warn", "unread", now));
        Notification read = Notification.of(USER_ID, "Bell", "warn", "already-read", now);
        read.markRead(now.minus(Duration.ofMinutes(10)));
        Instant priorReadAt = read.getReadAt();
        repository.save(read);

        service.markAllRead(USER_ID);

        var refreshedUnread = repository.findById(unread.getId()).orElseThrow();
        var refreshedRead = repository.findById(read.getId()).orElseThrow();
        assertThat(refreshedUnread.getReadAt()).isNotNull();
        assertThat(refreshedRead.getReadAt()).isEqualTo(priorReadAt);
    }

    @Test
    void deleteAll_removesAllForUserOnly() {
        Instant now = Instant.now();
        repository.save(Notification.of(USER_ID, "Bell", "warn", "내것1", now));
        repository.save(Notification.of(USER_ID, "Bell", "warn", "내것2", now));
        repository.save(Notification.of(OTHER_USER, "Bell", "warn", "남것", now));

        service.deleteAll(USER_ID);

        assertThat(repository.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(USER_ID, now.minus(Duration.ofDays(30)))).isEmpty();
        assertThat(repository.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(OTHER_USER, now.minus(Duration.ofDays(30)))).hasSize(1);
    }
}
```

- [ ] **Step 2: 테스트 fail 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.notification.NotificationServiceTest" 2>&1 | tail -15
```

Expected: FAIL — `NotificationService` 클래스 없음.

- [ ] **Step 3: DTO 작성**

Create `backend/src/main/java/com/twochi/notification/dto/NotificationItemResponse.java`:

```java
package com.twochi.notification.dto;

import java.time.Instant;

public record NotificationItemResponse(
    Long id,
    String icon,
    String iconTone,
    String message,
    Instant createdAt,
    Instant readAt
) {}
```

Create `backend/src/main/java/com/twochi/notification/dto/NotificationListResponse.java`:

```java
package com.twochi.notification.dto;

import java.util.List;

public record NotificationListResponse(List<NotificationItemResponse> notifications) {}
```

- [ ] **Step 4: NotificationService 작성**

Create `backend/src/main/java/com/twochi/notification/service/NotificationService.java`:

```java
package com.twochi.notification.service;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.dto.NotificationItemResponse;
import com.twochi.notification.dto.NotificationListResponse;
import com.twochi.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class NotificationService {

    private static final Duration RETENTION = Duration.ofDays(30);

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public NotificationListResponse list(Long userId) {
        Instant cutoff = Instant.now().minus(RETENTION);
        List<NotificationItemResponse> items = repository
            .findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, cutoff)
            .stream()
            .map(this::toResponse)
            .toList();
        return new NotificationListResponse(items);
    }

    @Transactional
    public void markAllRead(Long userId) {
        repository.markAllReadByUserId(userId, Instant.now());
    }

    @Transactional
    public void deleteAll(Long userId) {
        repository.deleteAllByUserId(userId);
    }

    private NotificationItemResponse toResponse(Notification n) {
        return new NotificationItemResponse(
            n.getId(), n.getIcon(), n.getIconTone(), n.getMessage(),
            n.getCreatedAt(), n.getReadAt()
        );
    }
}
```

- [ ] **Step 5: NotificationProducer 작성**

Create `backend/src/main/java/com/twochi/notification/service/NotificationProducer.java`:

```java
package com.twochi.notification.service;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Future-facing API for PR B2 (cron) / PR B3 (event producer).
 * PR B1 에선 seeder 만 사용. PR B2/B3 가 type/payload 도 필요해지면 메서드 overload 추가.
 */
@Service
public class NotificationProducer {

    private final NotificationRepository repository;

    public NotificationProducer(NotificationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Notification publish(Long userId, String icon, String iconTone, String message) {
        return repository.save(Notification.of(userId, icon, iconTone, message, Instant.now()));
    }
}
```

- [ ] **Step 6: 테스트 PASS 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.notification.NotificationServiceTest" 2>&1 | tail -10
```

Expected: 5 tests passed.

- [ ] **Step 7: 전체 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test 2>&1 | tail -5
```

Expected: BUILD SUCCESSFUL. 회귀 0.

- [ ] **Step 8: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/notification/service/NotificationService.java \
    backend/src/main/java/com/twochi/notification/service/NotificationProducer.java \
    backend/src/main/java/com/twochi/notification/dto/NotificationItemResponse.java \
    backend/src/main/java/com/twochi/notification/dto/NotificationListResponse.java \
    backend/src/test/java/com/twochi/notification/NotificationServiceTest.java
git commit -m "$(cat <<'EOF'
feat(nc): NotificationService + NotificationProducer + DTOs

- NotificationService: list (30일 cutoff) / markAllRead / deleteAll
- NotificationProducer.publish(userId, icon, tone, message) — PR B2/B3 future-facing API
- NotificationItemResponse / NotificationListResponse records
- Unit test 5건 (30일 filter / DESC 정렬 / user scope / markAllRead 기존 read 안 건드림 / deleteAll user scope)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: NotificationController + integration tests

**Files:**
- Create: `backend/src/main/java/com/twochi/notification/controller/NotificationController.java`
- Create: `backend/src/test/java/com/twochi/notification/NotificationIntegrationTest.java`

- [ ] **Step 1: 실패하는 integration test 먼저**

Create `backend/src/test/java/com/twochi/notification/NotificationIntegrationTest.java`:

```java
package com.twochi.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.notification.domain.Notification;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class NotificationIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
        notificationRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();

        Map<String, Object> signup = Map.of(
            "email", "alice@example.com",
            "password", "Pass1234!",
            "nickname", "alice",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(signup)));

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "alice@example.com", "password", "Pass1234!"))))
            .andReturn();
        JsonNode body = om.readTree(login.getResponse().getContentAsString());
        accessToken = body.get("accessToken").asText();
        userId = userRepository.findByEmailAndDeletedAtIsNull("alice@example.com").orElseThrow().getId();
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void getNotifications_returnsRecentItemsDesc() throws Exception {
        Instant now = Instant.now();
        notificationRepository.save(Notification.of(userId, "Bell", "warn", "최신", now.minus(Duration.ofHours(1))));
        notificationRepository.save(Notification.of(userId, "Check", "mint", "오래된", now.minus(Duration.ofHours(10))));

        mockMvc.perform(get("/api/v1/notifications")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.notifications.length()").value(2))
            .andExpect(jsonPath("$.notifications[0].message").value("최신"))
            .andExpect(jsonPath("$.notifications[1].message").value("오래된"));
    }

    @Test
    void getNotifications_filtersOut30DaysAgo() throws Exception {
        Instant now = Instant.now();
        notificationRepository.save(Notification.of(userId, "Bell", "warn", "최근", now.minus(Duration.ofDays(5))));
        notificationRepository.save(Notification.of(userId, "Bell", "warn", "오래", now.minus(Duration.ofDays(31))));

        mockMvc.perform(get("/api/v1/notifications")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.notifications.length()").value(1))
            .andExpect(jsonPath("$.notifications[0].message").value("최근"));
    }

    @Test
    void getNotifications_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void markAllRead_setsReadAt() throws Exception {
        Instant now = Instant.now();
        Notification a = notificationRepository.save(Notification.of(userId, "Bell", "warn", "a", now));
        Notification b = notificationRepository.save(Notification.of(userId, "Bell", "warn", "b", now));

        mockMvc.perform(patch("/api/v1/notifications/read-all")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        assertThat(notificationRepository.findById(a.getId()).orElseThrow().getReadAt()).isNotNull();
        assertThat(notificationRepository.findById(b.getId()).orElseThrow().getReadAt()).isNotNull();
    }

    @Test
    void deleteAll_removesAllForUser() throws Exception {
        Instant now = Instant.now();
        notificationRepository.save(Notification.of(userId, "Bell", "warn", "a", now));
        notificationRepository.save(Notification.of(userId, "Bell", "warn", "b", now));
        long otherUser = 9999L;
        notificationRepository.save(Notification.of(otherUser, "Bell", "warn", "남것", now));

        mockMvc.perform(delete("/api/v1/notifications")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());

        assertThat(notificationRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, now.minus(Duration.ofDays(30)))).isEmpty();
        assertThat(notificationRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(otherUser, now.minus(Duration.ofDays(30)))).hasSize(1);
    }
}
```

- [ ] **Step 2: 테스트 fail 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.notification.NotificationIntegrationTest" 2>&1 | tail -10
```

Expected: FAIL — controller 매핑 없음 (404).

- [ ] **Step 3: NotificationController 작성**

Create `backend/src/main/java/com/twochi/notification/controller/NotificationController.java`:

```java
package com.twochi.notification.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.notification.dto.NotificationListResponse;
import com.twochi.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<NotificationListResponse> list(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        return ResponseEntity.ok(service.list(principal.userId()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        service.markAllRead(principal.userId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAll(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        service.deleteAll(principal.userId());
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: 테스트 PASS 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.notification.NotificationIntegrationTest" 2>&1 | tail -10
```

Expected: 5 tests passed.

- [ ] **Step 5: 전체 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test 2>&1 | tail -5
```

Expected: BUILD SUCCESSFUL. 회귀 0.

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/notification/controller/NotificationController.java \
    backend/src/test/java/com/twochi/notification/NotificationIntegrationTest.java
git commit -m "$(cat <<'EOF'
feat(nc): NotificationController — 3 endpoint + integration tests

- GET /api/v1/notifications — 30일 cutoff + DESC 정렬
- PATCH /api/v1/notifications/read-all — 204
- DELETE /api/v1/notifications — 204
- 통합 테스트 5건 (정상 리스트 / 30일 filter / 미인증 401 / read-all / delete-all user scope)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: NotificationSeeder (dev profile)

**Files:**
- Create: `backend/src/main/java/com/twochi/notification/seed/NotificationSeeder.java`

- [ ] **Step 1: NotificationSeeder 작성**

Create `backend/src/main/java/com/twochi/notification/seed/NotificationSeeder.java`:

```java
package com.twochi.notification.seed;

import com.twochi.notification.domain.Notification;
import com.twochi.notification.repository.NotificationRepository;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Dev profile only. Application 시작 시 첫 사용자에게 sample 6개 insert.
 * Idempotent: notification 테이블에 이미 row 가 있으면 skip.
 * Prod 영향 0 (Bean 미등록).
 */
@Component
@Profile("dev")
public class NotificationSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(NotificationSeeder.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationSeeder(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (notificationRepository.count() > 0) {
            log.info("[NotificationSeeder] notification 테이블이 비어있지 않아 seeding skip");
            return;
        }

        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user == null) {
            log.info("[NotificationSeeder] 사용자 없음. seeding skip");
            return;
        }

        Instant now = Instant.now();
        notificationRepository.saveAll(List.of(
            Notification.of(user.getId(), "Bell",     "pink",    "카카오 백엔드 (Saas 팀) 서류 마감이 오늘 23:59예요", now.minus(Duration.ofHours(3))),
            Notification.of(user.getId(), "Check",    "mint",    "(주)테크컴퍼니 1차면접 일정이 등록됐어요",        now.minus(Duration.ofHours(5))),
            Notification.of(user.getId(), "Sparkle",  "default", "AI가 카카오 공고 매칭 결과를 정리했어요",         now.minus(Duration.ofHours(8))),
            Notification.of(user.getId(), "FileEdit", "mint",    "네이버 신입 백엔드 자소서가 저장됐어요",          now.minus(Duration.ofDays(1))),
            Notification.of(user.getId(), "Bell",     "warn",    "쿠팡 백엔드 (라스트마일) 마감 D-3",              now.minus(Duration.ofDays(2))),
            Notification.of(user.getId(), "Plus",     "default", "기업분석 — 카카오 분석이 완료됐어요",            now.minus(Duration.ofDays(3)))
        ));
        log.info("[NotificationSeeder] 사용자 {} 에게 sample 6개 insert", user.getId());
    }
}
```

- [ ] **Step 2: 컴파일 + 전체 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew compileJava && ./gradlew test 2>&1 | tail -5
```

Expected: BUILD SUCCESSFUL. test profile 에선 seeder bean 미등록이라 영향 0.

- [ ] **Step 3: 수동 sanity check (dev profile)**

```bash
# 1 터미널: dev DB up
cd /Users/sungjiwon/claude/2chi_v1 && docker-compose up -d postgres redis

# 2 터미널: bootRun (dev profile)
cd /Users/sungjiwon/claude/2chi_v1/backend && SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun
```

기다린 후 로그에서 다음 중 하나 확인:
- "[NotificationSeeder] 사용자 없음. seeding skip" (사용자 없을 때) OR
- "[NotificationSeeder] 사용자 X 에게 sample 6개 insert" (첫 사용자에 seed)

사용자가 있으면 row 6개 insert 확인:
```bash
psql -h localhost -p 5433 -U twochi -d twochi -c "SELECT id, icon, icon_tone, LEFT(message, 30), created_at FROM notification ORDER BY id;"
```

다시 bootRun 종료 + 재시작 → "테이블이 비어있지 않아 seeding skip" 로그 확인 (idempotent).

bootRun 종료 (Ctrl+C).

- [ ] **Step 4: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/notification/seed/NotificationSeeder.java
git commit -m "$(cat <<'EOF'
feat(nc): NotificationSeeder — dev profile only sample data

@Profile("dev") + CommandLineRunner. application 시작 시 첫 사용자에게 mock UI 와
동일한 6개 sample (Bell/Check/Sparkle/FileEdit/Plus + warn/pink/mint/default 톤)
insert. notification 테이블 비어있을 때만 (idempotent). prod 영향 0.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: FE foundation — types + api client

**Files:**
- Create: `frontend/src/lib/types/notification.ts`
- Create: `frontend/src/lib/api/notification.ts`

- [ ] **Step 1: 타입 정의**

Create `frontend/src/lib/types/notification.ts`:

```typescript
export type NotificationIconTone = "default" | "mint" | "lav" | "pink" | "warn";

export type NotificationItem = {
  id: number;
  icon: string;            // "Bell" | "Check" | "Sparkle" | "FileEdit" | "Plus" 등
  iconTone: NotificationIconTone;
  message: string;
  createdAt: string;       // ISO 8601
  readAt: string | null;   // ISO 8601 또는 null (unread)
};

export type NotificationListResponse = {
  notifications: NotificationItem[];
};
```

- [ ] **Step 2: API client**

Create `frontend/src/lib/api/notification.ts`:

```typescript
import { http } from "@/lib/api/http";
import type { NotificationListResponse } from "@/lib/types/notification";

export async function fetchNotifications(): Promise<NotificationListResponse> {
  const res = await http("/api/v1/notifications");
  if (!res.ok) throw new Error("알림을 불러오지 못했어요.");
  return res.json() as Promise<NotificationListResponse>;
}

export async function markAllRead(): Promise<void> {
  const res = await http("/api/v1/notifications/read-all", { method: "PATCH" });
  if (!res.ok) throw new Error("읽음 처리에 실패했어요.");
}

export async function deleteAllNotifications(): Promise<void> {
  const res = await http("/api/v1/notifications", { method: "DELETE" });
  if (!res.ok) throw new Error("전체 삭제에 실패했어요.");
}
```

- [ ] **Step 3: lint 통과**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run lint 2>&1 | tail -3
```

Expected: 0 errors.

- [ ] **Step 4: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/lib/types/notification.ts \
    frontend/src/lib/api/notification.ts
git commit -m "$(cat <<'EOF'
feat(nc-fe): notification 타입 + API client — foundation

- lib/types/notification.ts: NotificationItem / NotificationIconTone / NotificationListResponse
- lib/api/notification.ts: fetchNotifications / markAllRead / deleteAllNotifications

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: DeleteAllConfirmModal + NotiCenterView refactor

**Files:**
- Create: `frontend/src/components/mypage/delete-all-confirm-modal.tsx`
- Create: `frontend/src/components/mypage/__tests__/delete-all-confirm-modal.test.tsx`
- Modify: `frontend/src/components/mypage/noti-center-view.tsx`
- Modify: `frontend/src/components/mypage/__tests__/noti-center-view.test.tsx`
- Modify: `frontend/src/app/(app)/mypage/notification-center/page.tsx`

- [ ] **Step 1: DeleteAllConfirmModal 실패 테스트**

Create `frontend/src/components/mypage/__tests__/delete-all-confirm-modal.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteAllConfirmModal } from "../delete-all-confirm-modal";

const deleteAllMock = vi.fn();
vi.mock("@/lib/api/notification", () => ({
  deleteAllNotifications: (...args: unknown[]) => deleteAllMock(...args),
}));

beforeEach(() => {
  deleteAllMock.mockReset();
});

describe("DeleteAllConfirmModal", () => {
  it("calls deleteAllNotifications and onSuccess on confirm", async () => {
    deleteAllMock.mockResolvedValueOnce(undefined);
    const onSuccess = vi.fn();
    render(<DeleteAllConfirmModal onClose={vi.fn()} onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole("button", { name: /전체 삭제/ }));

    await waitFor(() => expect(deleteAllMock).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows error message when API fails", async () => {
    deleteAllMock.mockRejectedValueOnce(new Error("전체 삭제에 실패했어요."));
    const onSuccess = vi.fn();
    render(<DeleteAllConfirmModal onClose={vi.fn()} onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole("button", { name: /전체 삭제/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("전체 삭제에 실패했어요.");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("cancel button calls onClose", async () => {
    const onClose = vi.fn();
    render(<DeleteAllConfirmModal onClose={onClose} onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalled();
    expect(deleteAllMock).not.toHaveBeenCalled();
  });

  it("backdrop click calls onClose", async () => {
    const onClose = vi.fn();
    const { container } = render(<DeleteAllConfirmModal onClose={onClose} onSuccess={vi.fn()} />);
    const backdrop = container.querySelector(".pf-modal-backdrop") as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- delete-all-confirm-modal 2>&1 | tail -5
```

Expected: FAIL — module not found.

- [ ] **Step 3: DeleteAllConfirmModal 구현**

Create `frontend/src/components/mypage/delete-all-confirm-modal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { deleteAllNotifications } from "@/lib/api/notification";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export function DeleteAllConfirmModal({ onClose, onSuccess }: Props) {
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(undefined);
    setSubmitting(true);
    try {
      await deleteAllNotifications();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>알림 전체 삭제</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div role="note" style={{
            padding: "12px 14px",
            background: "var(--color-semantic-error-bg)",
            borderRadius: "var(--radius-md)",
            borderLeft: "3px solid var(--color-semantic-error)",
            fontSize: "13px",
            lineHeight: 1.6,
            marginBottom: "12px",
          }}>
            <div style={{ fontWeight: 600, marginBottom: "6px", color: "var(--color-semantic-error)" }}>
              알림 전체 삭제
            </div>
            <div>모든 알림이 영구 삭제됩니다. 이 작업은 되돌릴 수 없어요.</div>
          </div>
          {error && (
            <div role="alert" style={{
              padding: "8px 12px",
              background: "var(--color-semantic-error-bg)",
              color: "var(--color-semantic-error)",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              marginTop: "8px",
            }}>{error}</div>
          )}
        </div>

        <footer className="foot">
          <button type="button" className="btn ghost sm" onClick={onClose} disabled={submitting}>취소</button>
          <button type="button" className="btn danger sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "삭제 중..." : "전체 삭제"}
          </button>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: modal 테스트 PASS 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- delete-all-confirm-modal 2>&1 | tail -5
```

Expected: 4 tests passed.

- [ ] **Step 5: NotiCenterView 실패 테스트 (전체 교체)**

Modify `frontend/src/components/mypage/__tests__/noti-center-view.test.tsx` — 전체 교체:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotiCenterView } from "../noti-center-view";
import type { NotificationItem } from "@/lib/types/notification";

const fetchNotificationsMock = vi.fn();
const markAllReadMock = vi.fn();
const deleteAllMock = vi.fn();

vi.mock("@/lib/api/notification", () => ({
  fetchNotifications: (...args: unknown[]) => fetchNotificationsMock(...args),
  markAllRead: (...args: unknown[]) => markAllReadMock(...args),
  deleteAllNotifications: (...args: unknown[]) => deleteAllMock(...args),
}));

const sample: NotificationItem[] = [
  { id: 1, icon: "Bell", iconTone: "pink", message: "카카오 서류 마감", createdAt: "2026-05-27T09:00:00Z", readAt: null },
  { id: 2, icon: "Check", iconTone: "mint", message: "면접 일정 등록", createdAt: "2026-05-26T17:32:00Z", readAt: "2026-05-26T18:00:00Z" },
];

beforeEach(() => {
  fetchNotificationsMock.mockReset();
  markAllReadMock.mockReset();
  deleteAllMock.mockReset();
});

describe("NotiCenterView", () => {
  it("renders notifications after fetch", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    render(<NotiCenterView />);

    expect(await screen.findByText("카카오 서류 마감")).toBeInTheDocument();
    expect(screen.getByText("면접 일정 등록")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: [] });
    render(<NotiCenterView />);
    expect(await screen.findByText(/아직 받은 알림이 없어요/)).toBeInTheDocument();
  });

  it("mark-all-read button optimistically updates and calls API", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    markAllReadMock.mockResolvedValueOnce(undefined);

    render(<NotiCenterView />);
    await screen.findByText("카카오 서류 마감");

    await userEvent.click(screen.getByRole("button", { name: /모두 읽음/ }));
    await waitFor(() => expect(markAllReadMock).toHaveBeenCalled());
  });

  it("mark-all-read failure reverts and shows error", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    markAllReadMock.mockRejectedValueOnce(new Error("읽음 처리에 실패했어요."));

    render(<NotiCenterView />);
    await screen.findByText("카카오 서류 마감");

    await userEvent.click(screen.getByRole("button", { name: /모두 읽음/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("읽음 처리에 실패했어요.");
  });

  it("delete-all button opens DeleteAllConfirmModal", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    render(<NotiCenterView />);
    await screen.findByText("카카오 서류 마감");

    await userEvent.click(screen.getByRole("button", { name: /전체 삭제/ }));
    expect(screen.getByRole("heading", { name: "알림 전체 삭제" })).toBeInTheDocument();
  });

  it("delete-all modal cancel does not call API", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    render(<NotiCenterView />);
    await screen.findByText("카카오 서류 마감");

    await userEvent.click(screen.getByRole("button", { name: /전체 삭제/ }));
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(deleteAllMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "알림 전체 삭제" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- noti-center-view 2>&1 | tail -10
```

Expected: 기존 prop-driven 테스트 + 새 fetch-driven 테스트 모두 FAIL.

- [ ] **Step 7: NotiCenterView refactor (전체 교체)**

Modify `frontend/src/components/mypage/noti-center-view.tsx` — 전체 교체:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { fetchNotifications, markAllRead } from "@/lib/api/notification";
import { formatRelativeKo } from "@/lib/utils/relative-time";
import type { NotificationItem } from "@/lib/types/notification";
import { Bell, Check, Sparkle, FileEdit, Plus } from "@/components/ui/icons";
import { DeleteAllConfirmModal } from "./delete-all-confirm-modal";

const IcoMap: Record<string, React.FC<{ size?: number }>> = {
  Bell, Check, Sparkle, FileEdit, Plus,
};

function NotiRow({ entry }: { entry: NotificationItem }) {
  const Icon = IcoMap[entry.icon] ?? Bell;
  const toneClass = entry.iconTone === "default" ? "" : ` ${entry.iconTone}`;
  const unread = entry.readAt === null;
  return (
    <div className={`noti-row${unread ? " unread" : ""}`}>
      <span className={`ico${toneClass}`}>
        <Icon size={14} />
      </span>
      <div className="body">
        <span className="ttl">{entry.message}</span>
      </div>
      <span className="time">{formatRelativeKo(new Date(entry.createdAt))}</span>
      <span className="unread-dot" />
    </div>
  );
}

export function NotiCenterView() {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchNotifications()
      .then((r) => setItems(r.notifications))
      .catch((e) => setError(e instanceof Error ? e.message : "알림을 불러오지 못했어요."));
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  function showTransientError(msg: string) {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setError(undefined);
      errorTimerRef.current = null;
    }, 3000);
  }

  async function handleMarkAllRead() {
    if (!items) return;
    const nowIso = new Date().toISOString();
    setItems((curr) => curr?.map((i) => i.readAt === null ? { ...i, readAt: nowIso } : i) ?? null);
    try {
      await markAllRead();
    } catch (e) {
      // revert by re-flipping the items that were just optimistically marked
      setItems((curr) => curr?.map((i) => i.readAt === nowIso ? { ...i, readAt: null } : i) ?? null);
      showTransientError(e instanceof Error ? e.message : "읽음 처리에 실패했어요.");
    }
  }

  if (error && !items) return <div role="alert" className="error-banner">{error}</div>;
  if (!items) return <div className="loading">불러오는 중...</div>;

  return (
    <>
      <section
        className="mp-head"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}
      >
        <div>
          <h1>알림 센터</h1>
          <div className="sub">
            최근 30일간 받은 알림이에요. 읽지 않은 알림은 페리윙클로 표시돼요.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn ghost sm" onClick={handleMarkAllRead} disabled={items.length === 0}>
            <Check size={12} /> 모두 읽음
          </button>
          <button className="btn secondary sm" onClick={() => setConfirmingDelete(true)} disabled={items.length === 0}>
            전체 삭제
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" style={{
          padding: "10px 14px",
          background: "var(--color-semantic-error-bg)",
          color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)",
          marginBottom: "12px",
          fontSize: "13px",
        }}>{error}</div>
      )}

      {items.length === 0 ? (
        <section className="noti-shell">
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-muted)" }}>
            아직 받은 알림이 없어요.
          </div>
        </section>
      ) : (
        <section className="noti-shell">
          {items.map((entry) => (
            <NotiRow key={entry.id} entry={entry} />
          ))}
        </section>
      )}

      {confirmingDelete && (
        <DeleteAllConfirmModal
          onClose={() => setConfirmingDelete(false)}
          onSuccess={() => {
            setItems([]);
            setConfirmingDelete(false);
          }}
        />
      )}
    </>
  );
}
```

- [ ] **Step 8: page entry 갱신**

Modify `frontend/src/app/(app)/mypage/notification-center/page.tsx`:

```typescript
import { NotiCenterView } from "@/components/mypage/noti-center-view";

export default function MyPageNotificationCenter() {
  return <NotiCenterView />;
}
```

- [ ] **Step 9: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- "(noti-center-view|delete-all-confirm-modal)" 2>&1 | tail -10
```

Expected: 6 + 4 = 10 tests passed.

- [ ] **Step 10: 전체 회귀 + lint**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run lint && npm run test 2>&1 | tail -5
```

Expected: 0 lint errors, 모든 테스트 통과.

- [ ] **Step 11: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/mypage/delete-all-confirm-modal.tsx \
    frontend/src/components/mypage/__tests__/delete-all-confirm-modal.test.tsx \
    frontend/src/components/mypage/noti-center-view.tsx \
    frontend/src/components/mypage/__tests__/noti-center-view.test.tsx \
    frontend/src/app/(app)/mypage/notification-center/page.tsx
git commit -m "$(cat <<'EOF'
feat(nc-fe): NotiCenterView refactor + DeleteAllConfirmModal

- NotiCenterView: prop-driven → self-fetching. useEffect + fetchNotifications.
  mark-all-read optimistic update + revert + 3초 auto-dismiss error.
  delete-all → modal trigger. 빈 상태 ("아직 받은 알림이 없어요"). createdAt 을
  formatRelativeKo (PR #26 utility) 로 시각 표시
- DeleteAllConfirmModal 신규 (PR A WithdrawConfirmModal 패턴 — pf-modal shell,
  warn box, btn danger sm)
- page.tsx mock prop 제거
- 통합 테스트 6 (view) + 4 (modal) = 10

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: TopNav bell navigation + mock cleanup + 최종 검증 + PR

**Files:**
- Modify: `frontend/src/components/app-shell/top-nav.tsx`
- Modify: `frontend/src/components/app-shell/__tests__/top-nav.test.tsx`
- Modify: `frontend/src/lib/mock/mypage.ts`

- [ ] **Step 1: TopNav 실패 테스트 (navigation 1건 추가)**

Modify `frontend/src/components/app-shell/__tests__/top-nav.test.tsx` — 기존 file 의 describe 블록 안에 다음 테스트 1건 추가:

먼저 file 읽기로 기존 mock setup 확인:
```bash
head -30 /Users/sungjiwon/claude/2chi_v1/frontend/src/components/app-shell/__tests__/top-nav.test.tsx
```

기존 `vi.mock("next/navigation", ...)` 패턴이 있으면 `pushMock` 또는 비슷한 이름을 재사용. 없으면 추가:

```typescript
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/",  // 기존 TopNav 가 usePathname 사용 시
}));
```

그리고 다음 테스트 추가 (describe 블록 안에):

```typescript
it("bell button navigates to /mypage/notification-center", async () => {
  render(<TopNav />);

  const bellButton = screen.getByRole("button", { name: "알림" });
  await userEvent.click(bellButton);

  expect(pushMock).toHaveBeenCalledWith("/mypage/notification-center");
});
```

**참고**: 기존 top-nav.test.tsx 가 `useAuth` 등을 mock 하고 있으면 그것도 유지. 새 테스트 추가만.

- [ ] **Step 2: 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- top-nav 2>&1 | tail -10
```

Expected: 신규 테스트 FAIL — alert 호출되지만 push 호출 안 됨.

- [ ] **Step 3: TopNav 수정 — alert 제거 + router.push**

`frontend/src/components/app-shell/top-nav.tsx` — 기존 `import` 영역에 `useRouter` 추가 (없으면):

```typescript
"use client";
import { useRouter } from "next/navigation";
```

(이미 useRouter 가 다른 용도로 import 돼 있으면 재사용. 함수 본문 시작부에 `const router = useRouter();` 추가)

기존 bell NavIconButton 의 onClick 교체:

기존:
```tsx
<NavIconButton
  ariaLabel="알림"
  onClick={() => alert("알림 기능은 곧 제공됩니다.")}
>
  <BellIcon />
</NavIconButton>
```

다음으로:
```tsx
<NavIconButton
  ariaLabel="알림"
  onClick={() => router.push("/mypage/notification-center")}
>
  <BellIcon />
</NavIconButton>
```

- [ ] **Step 4: 테스트 PASS 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run test -- top-nav 2>&1 | tail -5
```

Expected: 모든 top-nav 테스트 통과 (기존 + 신규).

- [ ] **Step 5: mock cleanup**

Modify `/Users/sungjiwon/claude/2chi_v1/frontend/src/lib/mock/mypage.ts` — 다음 2 블록 제거:
1. `export type NotiCenterEntry = { ... }`
2. `export const NOTI_CENTER_MOCK: NotiCenterEntry[] = [ ... ]`

유지 (v2 OAuth 까지):
- `SocialProvider` / `SocialConnection` / `SOCIAL_MOCK`

- [ ] **Step 6: 사용처 잔존 검사**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && grep -rn "NotiCenterEntry\|NOTI_CENTER_MOCK" src/ 2>&1 | head -10
```

Expected: 검색 결과 0 (Task 6 의 NotiCenterView refactor 가 사용처 제거 완료).

- [ ] **Step 7: develop 최신과 rebase**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git fetch origin
git rebase origin/develop
```

Expected: `Successfully rebased and updated` 또는 conflict 없음.

- [ ] **Step 8: 전체 build · lint · test 통과**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend && npm run lint && npm run test && npm run build 2>&1 | tail -10
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew clean build 2>&1 | tail -10
```

Expected: FE lint 0 / FE test 통과 / FE Compiled successfully / BE BUILD SUCCESSFUL.

- [ ] **Step 9: 수동 sanity check (선택)**

```bash
cd /Users/sungjiwon/claude/2chi_v1 && docker-compose up -d postgres redis
# 별도 터미널: SPRING_PROFILES_ACTIVE=dev cd backend && ./gradlew bootRun
# 별도 터미널: cd frontend && npm run dev
```

브라우저 흐름:
1. `/login` 가입한 사용자로 로그인
2. TopNav 의 알림 벨 클릭 → `/mypage/notification-center` 이동
3. seed 6개 알림 표시 (5 unread + 1 read)
4. "모두 읽음" 클릭 → 모두 unread-dot 사라짐 → 새로고침 후 유지
5. "전체 삭제" 클릭 → 모달 → "전체 삭제" → 빈 상태 "아직 받은 알림이 없어요"
6. 모달 backdrop click / 취소 button — 정상 close

dev 서버 종료.

- [ ] **Step 10: 커밋 (mock cleanup + TopNav)**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/app-shell/top-nav.tsx \
    frontend/src/components/app-shell/__tests__/top-nav.test.tsx \
    frontend/src/lib/mock/mypage.ts
git commit -m "$(cat <<'EOF'
feat(nc-fe): TopNav bell navigation + mock cleanup (NOTI_CENTER_MOCK)

- TopNav bell button: alert("...곧 제공...") → router.push("/mypage/notification-center")
- top-nav.test 에 navigation 검증 1 test 추가
- lib/mock/mypage.ts: NotiCenterEntry + NOTI_CENTER_MOCK 제거. SOCIAL 만 남음 (v2 OAuth)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 11: push + PR 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git push -u origin feat/noti-center-pr-b1
gh pr create --base develop --title "feat(nc): notification core + FE wiring + dev seed (PR B 시리즈 1번째)" --body "$(cat <<'EOF'
## Summary

mypage 알림 센터 (`/mypage/notification-center`) 의 mock 을 실 데이터로 wiring.
PR B 시리즈 중 1번째 — notification core + FE + dev seed. PR B2 (cron) / PR B3 (event producer) 는 별도 cycle.

- `notification` 테이블 + 3 endpoint (GET list / PATCH read-all / DELETE all)
- `NotificationProducer.publish(userId, icon, tone, message)` — PR B2/B3 future-facing API
- FE `NotiCenterView` refactor (prop-driven → self-fetching) + `DeleteAllConfirmModal`
- TopNav 알림 벨 — alert → `/mypage/notification-center` navigation
- dev profile seeder (sample 6개, idempotent)

## DB

- V5 migration: `notification` 테이블 + `(user_id, created_at DESC)` 복합 인덱스
- 30일 query filter (cleanup cron 은 PR B2)
- `read_at` nullable (NULL = unread, 별도 boolean 컬럼 불필요)

## 핵심 결정 (spec 참조)

- **3 PR 분해** — B1 (이 PR) / B2 cron / B3 event producer. 머지 cadence 짧게
- **Schema A** — 구체 컬럼 (icon/iconTone/message). v1 closed beta — i18n 불필요
- **No pagination + 30일 filter** — 사용자당 월 ~50건 규모. cleanup cron 은 PR B2
- **TopNav navigation only** (unread dot 은 PR B3 후 follow-up)
- **Bulk-only + hard delete** — mock UI 에 per-row 인터랙션 없음. soft delete 의미 없음 (30일 ephemeral)
- **DeleteAllConfirmModal** — PR A modal 패턴 일관 (native confirm 안 씀)
- **@Profile("dev") seeder** — idempotent. prod 영향 0

## Tests

- BE: 5 unit test (NotificationService) + 5 integration test (controller)
- FE: 6 NotiCenterView + 4 DeleteAllConfirmModal + 1 TopNav navigation
- 회귀 0

## Known Limitations (이후 PR / v2)

1. **Cron 인프라 + 4 scheduled jobs** (deadline-d3/d1 / interview-d1 / cl-unsubmitted / weekly-summary) → PR B2
2. **30일 cleanup cron** → PR B2
3. **Event-triggered producer** (auth / application / posting / cover-letter / AI) → PR B3
4. **TopNav unread dot + polling** → PR B3 머지 후 small follow-up
5. **Email/Push 채널 통합** (FCM / SMTP) → v2
6. **Per-row mark-read 클릭** → v2 (mock UI 에 없음)
7. **카테고리 필터 / 검색** → v2
8. **Pagination** → v2 (closed beta 불필요)
9. **`type` 필드** (DEADLINE_D3 등 분류용) → v2 (schema 마이그레이션)

## 후속

- spec: `docs/superpowers/specs/2026-05-27-feat-noti-center-pr-b1-design.md`
- plan: `docs/superpowers/plans/2026-05-27-feat-noti-center-pr-b1.md`

## Test plan

- [x] `./gradlew test` BUILD SUCCESSFUL
- [x] `npm run lint && npm run test && npm run build` 통과
- [ ] 수동 sanity: dev seed 6개 표시 / mark-all-read / delete-all modal / TopNav bell click

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL 출력.

- [ ] **Step 12: 사용자에게 PR URL 보고**

PR URL 보고. plan 완료.

---

## 완료 조건 (Done definition)

- 7 task 모두 commit · push 완료
- PR 이 develop 기준으로 생성 + CI 통과
- 신규 BE 테스트 10건 (service 5 + controller 5) 통과
- 신규 FE 테스트 11건 (view 6 + modal 4 + topnav 1) 통과
- 기존 FE/BE 테스트 회귀 0
- V5 migration 이 dev/test DB 양쪽에서 성공
- 수동 sanity: TopNav bell → noti-center 로 이동, seed 6개 표시, mark-all-read + delete-all 정상 동작
