# `feat/mypage-be-pr-a` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mypage cluster 5 endpoint 중 3개 (account · noti-settings · withdraw) 의 BE 구현. social → v2 OAuth, noti-center → PR B.

**Architecture:**
기존 `com.twochi.user.controller.UserController` 에 PATCH /me · PATCH /me/password · DELETE /me 추가. `NotiSettingsController` 신규. service 는 책임별 분리(`UserProfileUpdateService` · `PasswordChangeService` · `AccountClosureService` · `NotiSettingService`). 탈퇴는 `user.deleted_at` 만 세팅하고 FK CASCADE 가 v2 hard-delete cron 에서 처리. 로그인/refresh 단계에서 `deleted_at` 분기로 access window 자연스럽게 캡(token 만료 ~15분).

**Tech Stack:** Spring Boot 3.5.6 · Java 17 · JPA · Flyway · JWT · Lombok · Testcontainers-free integration test (기존 `@SpringBootTest + MockMvc + ActiveProfiles("test")` 패턴)

**Spec:** [`docs/superpowers/specs/2026-05-27-feat-mypage-be-pr-a-design.md`](../specs/2026-05-27-feat-mypage-be-pr-a-design.md)

---

## File Structure

| 파일 | 변경 종류 | 한 줄 책임 |
|---|---|---|
| `backend/src/main/resources/db/migration/V4__mypage_password_changed_at_and_noti_settings.sql` | create | `app_user.password_changed_at` 컬럼 + `user_noti_setting` 테이블 |
| `backend/src/main/resources/db/migration/V4_R__rollback.sql` | create | 위 마이그레이션 down (수동 repair 절차용) |
| `backend/src/main/java/com/twochi/user/domain/User.java` | modify | `passwordChangedAt` 필드 + `changePassword(hash, now)` + `withdraw(now)` 메서드 |
| `backend/src/main/java/com/twochi/user/domain/UserNotiSetting.java` | create | `(userId, settingId, enabled, updatedAt)` 엔티티 |
| `backend/src/main/java/com/twochi/user/domain/UserNotiSettingId.java` | create | 위 엔티티의 composite PK |
| `backend/src/main/java/com/twochi/user/domain/noti/NotiSettingDef.java` | create | 12 정의 enum |
| `backend/src/main/java/com/twochi/user/repository/UserRepository.java` | modify | `findByEmail(String)` 메서드 추가 (deleted 포함) |
| `backend/src/main/java/com/twochi/user/repository/UserNotiSettingRepository.java` | create | sparse override CRUD |
| `backend/src/main/java/com/twochi/user/dto/MeResponse.java` | modify | `joinedAt`/`passwordChangedAt`/`plan` 필드 추가 |
| `backend/src/main/java/com/twochi/user/dto/UpdateNicknameRequest.java` | create | nickname PATCH body |
| `backend/src/main/java/com/twochi/user/dto/ChangePasswordRequest.java` | create | password PATCH body |
| `backend/src/main/java/com/twochi/user/dto/WithdrawRequest.java` | create | withdraw DELETE body |
| `backend/src/main/java/com/twochi/user/dto/NotiSettingsResponse.java` | create | noti-settings GET 응답 |
| `backend/src/main/java/com/twochi/user/dto/NotiSettingItem.java` | create | 알림 항목 1개 |
| `backend/src/main/java/com/twochi/user/dto/UpdateNotiSettingsRequest.java` | create | noti-settings PATCH body |
| `backend/src/main/java/com/twochi/user/service/UserQueryService.java` | modify | MeResponse 의 3 신규 필드 채움 |
| `backend/src/main/java/com/twochi/user/service/UserProfileUpdateService.java` | create | 닉네임 변경 |
| `backend/src/main/java/com/twochi/user/service/PasswordChangeService.java` | create | currentPassword 검증 + 해시 갱신 + `password_changed_at` |
| `backend/src/main/java/com/twochi/user/service/AccountClosureService.java` | create | currentPassword 검증 + `deleted_at` 세팅 |
| `backend/src/main/java/com/twochi/user/service/noti/NotiSettingService.java` | create | enum + override 머지 + sparse upsert |
| `backend/src/main/java/com/twochi/user/controller/UserController.java` | modify | PATCH /me, PATCH /me/password, DELETE /me 추가 |
| `backend/src/main/java/com/twochi/user/controller/NotiSettingsController.java` | create | GET/PATCH /me/noti-settings |
| `backend/src/main/java/com/twochi/auth/service/LoginService.java` | modify | `findByEmail` 변경 + `deleted_at` 분기 |
| `backend/src/main/java/com/twochi/auth/service/RefreshTokenService.java` | modify | refresh 시 `deleted_at` 체크 |
| `backend/src/main/java/com/twochi/common/exception/ErrorCode.java` | modify | 6 신규 code (USER_WITHDRAWN/USER_WITHDRAWN_GRACE/ALREADY_WITHDRAWN/PASSWORD_MISMATCH/PASSWORD_UNCHANGED/SETTING_LOCKED/UNKNOWN_SETTING) |
| `backend/src/test/java/com/twochi/user/MeIntegrationTest.java` | modify | 응답 shape 3 신규 필드 검증 |
| `backend/src/test/java/com/twochi/user/UserProfileIntegrationTest.java` | create | PATCH /me (nickname) end-to-end |
| `backend/src/test/java/com/twochi/user/PasswordChangeIntegrationTest.java` | create | PATCH /me/password |
| `backend/src/test/java/com/twochi/user/AccountClosureIntegrationTest.java` | create | DELETE /me + login/refresh 차단 회귀 |
| `backend/src/test/java/com/twochi/user/NotiSettingsIntegrationTest.java` | create | GET/PATCH /me/noti-settings |

---

## Task 1: 브랜치 생성 + V4 마이그레이션 + User 엔티티 확장 + MeResponse 확장

**Files:**
- Create: `backend/src/main/resources/db/migration/V4__mypage_password_changed_at_and_noti_settings.sql`
- Create: `backend/src/main/resources/db/migration/V4_R__rollback.sql`
- Modify: `backend/src/main/java/com/twochi/user/domain/User.java`
- Modify: `backend/src/main/java/com/twochi/user/dto/MeResponse.java`
- Modify: `backend/src/main/java/com/twochi/user/service/UserQueryService.java`
- Modify: `backend/src/test/java/com/twochi/user/MeIntegrationTest.java`

- [ ] **Step 1: develop 동기화 + 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop
git pull origin develop
git checkout -b feat/mypage-be-pr-a
```

Expected: `Switched to a new branch 'feat/mypage-be-pr-a'`

- [ ] **Step 2: V4 마이그레이션 작성**

Create `backend/src/main/resources/db/migration/V4__mypage_password_changed_at_and_noti_settings.sql`:

```sql
-- 1. app_user.password_changed_at 추가 (NULLABLE) + 기존 사용자 backfill
ALTER TABLE app_user ADD COLUMN password_changed_at TIMESTAMPTZ;
COMMENT ON COLUMN app_user.password_changed_at IS
    '마지막 비밀번호 변경 시각. NULL 이면 가입 후 한 번도 변경 안 함 (가입 시각이 기준)';
UPDATE app_user SET password_changed_at = created_at WHERE password_changed_at IS NULL;

-- 2. user_noti_setting (sparse override 테이블)
CREATE TABLE user_noti_setting (
    user_id     BIGINT       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    setting_id  VARCHAR(40)  NOT NULL,
    enabled     BOOLEAN      NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, setting_id)
);
COMMENT ON TABLE  user_noti_setting IS '알림 설정 per-user override. default 와 다른 항목만 row 로 저장(sparse)';
COMMENT ON COLUMN user_noti_setting.setting_id IS 'NotiSettingDef enum 의 키 (deadline-d3 등)';
```

Create `backend/src/main/resources/db/migration/V4_R__rollback.sql` (수동 repair 용, Flyway 가 자동 실행하지 않음):

```sql
-- V4 rollback (manual). 사용 시: Flyway repair 후 이 스크립트 직접 실행
DROP TABLE IF EXISTS user_noti_setting;
ALTER TABLE app_user DROP COLUMN IF EXISTS password_changed_at;
```

- [ ] **Step 3: User 엔티티에 `passwordChangedAt` 필드 + 메서드 추가**

Modify `backend/src/main/java/com/twochi/user/domain/User.java`:

기존 필드 영역의 `deletedAt` 위 또는 아래에 추가:

```java
    @Column(name = "password_changed_at")
    private Instant passwordChangedAt;
```

기존 `createEmailUser` 정적 팩토리 메서드 안의 `this.createdAt = now;` 줄 바로 아래에 한 줄 추가:

```java
        this.passwordChangedAt = now;
```

기존 `recordLoginSuccess` 메서드 끝에 클래스의 마지막 메서드로 두 개 추가:

```java
    public void changePassword(String newPasswordHash, Instant now) {
        this.passwordHash = newPasswordHash;
        this.passwordChangedAt = now;
        this.updatedAt = now;
    }

    public void withdraw(Instant now) {
        this.deletedAt = now;
        this.updatedAt = now;
    }
```

- [ ] **Step 4: MeResponse 확장**

Modify `backend/src/main/java/com/twochi/user/dto/MeResponse.java` — 전체 교체:

```java
package com.twochi.user.dto;

import java.time.Instant;

public record MeResponse(
    Long userId,
    String email,
    String nickname,
    String role,
    boolean onboardingCompleted,
    Instant joinedAt,
    Instant passwordChangedAt,
    String plan
) {}
```

- [ ] **Step 5: UserQueryService 확장**

Modify `backend/src/main/java/com/twochi/user/service/UserQueryService.java` — 전체 교체:

```java
package com.twochi.user.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.Profile;
import com.twochi.user.domain.User;
import com.twochi.user.dto.MeResponse;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserQueryService {

    private static final String DEFAULT_PLAN = "free";

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    public UserQueryService(ProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public MeResponse buildMe(Long userId, String email, String nickname, String role) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));
        boolean completed = profileRepository.findById(userId)
            .map(Profile::isOnboardingCompleted)
            .orElse(false);
        return new MeResponse(
            userId,
            email,
            nickname,
            role,
            completed,
            user.getCreatedAt(),
            user.getPasswordChangedAt(),
            DEFAULT_PLAN
        );
    }
}
```

- [ ] **Step 6: 기존 MeIntegrationTest 갱신 — 신규 필드 검증**

Modify `backend/src/test/java/com/twochi/user/MeIntegrationTest.java` — 기존 `me_validAccessToken_returnsUserInfo` 테스트의 jsonPath 체인 끝에 다음 3 줄 추가 (앞 expect 줄에 `;` 가 있다면 `.` 으로 변경):

```java
    @Test
    void me_validAccessToken_returnsUserInfo() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("alice@example.com"))
            .andExpect(jsonPath("$.nickname").value("alice"))
            .andExpect(jsonPath("$.role").value("USER"))
            .andExpect(jsonPath("$.userId").isNumber())
            .andExpect(jsonPath("$.joinedAt").isString())
            .andExpect(jsonPath("$.passwordChangedAt").isString())
            .andExpect(jsonPath("$.plan").value("free"));
    }
```

- [ ] **Step 7: build + 테스트**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.MeIntegrationTest" --info
```

Expected: 5 tests passed (기존 4 + 강화된 1). Flyway 가 V4 마이그레이션을 실행하고 신규 필드가 응답에 포함.

- [ ] **Step 8: 전체 회귀 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test
```

Expected: 모든 테스트 통과 (기존 + MeIntegrationTest 강화).

- [ ] **Step 9: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/resources/db/migration/V4__mypage_password_changed_at_and_noti_settings.sql \
    backend/src/main/resources/db/migration/V4_R__rollback.sql \
    backend/src/main/java/com/twochi/user/domain/User.java \
    backend/src/main/java/com/twochi/user/dto/MeResponse.java \
    backend/src/main/java/com/twochi/user/service/UserQueryService.java \
    backend/src/test/java/com/twochi/user/MeIntegrationTest.java
git commit -m "$(cat <<'EOF'
feat(mp-be): V4 migration + User.passwordChangedAt + MeResponse 확장 (joinedAt/passwordChangedAt/plan)

- V4 마이그레이션: app_user.password_changed_at 컬럼 (기존 사용자 created_at 으로 backfill)
  + user_noti_setting sparse override 테이블
- User 엔티티: passwordChangedAt 필드 + changePassword(hash, now) + withdraw(now) 메서드
- MeResponse: joinedAt (createdAt) / passwordChangedAt / plan ("free" hardcode) 3 필드 추가
- UserQueryService: User 엔티티 조회로 변경 (jwt claims 만으로는 신규 필드 못 채움)
- MeIntegrationTest 갱신: 신규 필드 jsonPath 검증

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: PATCH /api/v1/users/me — 닉네임 변경

**Files:**
- Create: `backend/src/main/java/com/twochi/user/dto/UpdateNicknameRequest.java`
- Create: `backend/src/main/java/com/twochi/user/service/UserProfileUpdateService.java`
- Modify: `backend/src/main/java/com/twochi/user/controller/UserController.java`
- Create: `backend/src/test/java/com/twochi/user/UserProfileIntegrationTest.java`

- [ ] **Step 1: 실패하는 통합 테스트 작성**

Create `backend/src/test/java/com/twochi/user/UserProfileIntegrationTest.java`:

```java
package com.twochi.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
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

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class UserProfileIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
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
    }

    @AfterEach
    void tearDown() {
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void patchMe_validNickname_updatesAndReturnsMe() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("nickname", "new_nick"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nickname").value("new_nick"));
    }

    @Test
    void patchMe_duplicateNickname_returns409() throws Exception {
        // 다른 사용자 가입
        Map<String, Object> other = Map.of(
            "email", "bob@example.com",
            "password", "Pass1234!",
            "nickname", "bob",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(other)));

        mockMvc.perform(patch("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("nickname", "bob"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("NICKNAME_DUPLICATE"));
    }

    @Test
    void patchMe_sameNickname_returns200NoOp() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("nickname", "alice"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nickname").value("alice"));
    }

    @Test
    void patchMe_invalidNickname_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("nickname", "x")))) // 1자 — pattern 위반
            .andExpect(status().isBadRequest());
    }

    @Test
    void patchMe_unauthenticated_returns401() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("nickname", "x"))))
            .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.UserProfileIntegrationTest" 2>&1 | tail -30
```

Expected: 컴파일은 통과하지만 PATCH /api/v1/users/me 가 없어서 405 또는 404 로 FAIL.

- [ ] **Step 3: UpdateNicknameRequest DTO 작성**

Create `backend/src/main/java/com/twochi/user/dto/UpdateNicknameRequest.java`:

```java
package com.twochi.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateNicknameRequest(

    @NotBlank
    @Pattern(
        regexp = "^[가-힣A-Za-z0-9_-]{2,20}$",
        message = "닉네임은 2~20자의 한글/영문/숫자 및 -, _ 만 가능합니다."
    )
    String nickname

) {}
```

(signup 규칙과 동일.)

- [ ] **Step 4: UserProfileUpdateService 작성**

Create `backend/src/main/java/com/twochi/user/service/UserProfileUpdateService.java`:

```java
package com.twochi.user.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class UserProfileUpdateService {

    private final UserRepository userRepository;

    public UserProfileUpdateService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User updateNickname(Long userId, String newNickname) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));

        if (newNickname.equals(user.getNickname())) {
            return user; // no-op
        }

        if (userRepository.existsByNicknameAndDeletedAtIsNull(newNickname)) {
            throw new BusinessException(ErrorCode.NICKNAME_DUPLICATE);
        }

        user.changeNickname(newNickname, Instant.now());
        return userRepository.save(user);
    }
}
```

- [ ] **Step 5: User 엔티티에 `changeNickname` 메서드 추가**

Modify `backend/src/main/java/com/twochi/user/domain/User.java` — `withdraw` 메서드 위에 추가:

```java
    public void changeNickname(String newNickname, Instant now) {
        this.nickname = newNickname;
        this.updatedAt = now;
    }
```

- [ ] **Step 6: UserController 에 PATCH /me 추가**

Modify `backend/src/main/java/com/twochi/user/controller/UserController.java` — 클래스 끝에 메서드 추가 + 필드/생성자 보강:

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserQueryService userQueryService;
    private final UserProfileUpdateService userProfileUpdateService;

    public UserController(UserQueryService userQueryService,
                          UserProfileUpdateService userProfileUpdateService) {
        this.userQueryService = userQueryService;
        this.userProfileUpdateService = userProfileUpdateService;
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(userQueryService.buildMe(
            principal.userId(), principal.email(), principal.nickname(), principal.role()
        ));
    }

    @PatchMapping("/me")
    public ResponseEntity<MeResponse> updateNickname(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody UpdateNicknameRequest req) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        User updated = userProfileUpdateService.updateNickname(principal.userId(), req.nickname());
        return ResponseEntity.ok(userQueryService.buildMe(
            updated.getId(), updated.getEmail(), updated.getNickname(), updated.getRole()
        ));
    }
}
```

신규 import:
```java
import com.twochi.user.domain.User;
import com.twochi.user.dto.UpdateNicknameRequest;
import com.twochi.user.service.UserProfileUpdateService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.UserProfileIntegrationTest"
```

Expected: 5 tests passed.

- [ ] **Step 8: 전체 회귀 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test
```

Expected: 모든 테스트 통과.

- [ ] **Step 9: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/user/dto/UpdateNicknameRequest.java \
    backend/src/main/java/com/twochi/user/service/UserProfileUpdateService.java \
    backend/src/main/java/com/twochi/user/controller/UserController.java \
    backend/src/main/java/com/twochi/user/domain/User.java \
    backend/src/test/java/com/twochi/user/UserProfileIntegrationTest.java
git commit -m "$(cat <<'EOF'
feat(mp-be): PATCH /api/v1/users/me — 닉네임 변경

- UpdateNicknameRequest DTO (signup 와 동일한 pattern 규칙 재사용)
- UserProfileUpdateService.updateNickname — 중복 검증 + no-op 분기
- User.changeNickname(newNickname, now) 메서드
- UserController.updateNickname 매핑
- 통합 테스트 5건 (정상 / 중복 NICKNAME_DUPLICATE / no-op / 형식 위반 / 미인증)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: PATCH /api/v1/users/me/password — 비밀번호 변경

**Files:**
- Modify: `backend/src/main/java/com/twochi/common/exception/ErrorCode.java`
- Create: `backend/src/main/java/com/twochi/user/dto/ChangePasswordRequest.java`
- Create: `backend/src/main/java/com/twochi/user/service/PasswordChangeService.java`
- Modify: `backend/src/main/java/com/twochi/user/controller/UserController.java`
- Create: `backend/src/test/java/com/twochi/user/PasswordChangeIntegrationTest.java`

- [ ] **Step 1: ErrorCode 2개 추가 (PASSWORD_MISMATCH, PASSWORD_UNCHANGED)**

Modify `backend/src/main/java/com/twochi/common/exception/ErrorCode.java` — 마지막 `EVENT_NOT_FOUND` 뒤(세미콜론 직전)에 두 줄 추가:

```java
    EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "일정을 찾을 수 없어요."),
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않아요."),
    PASSWORD_UNCHANGED(HttpStatus.BAD_REQUEST, "현재 비밀번호와 동일해요. 다른 비밀번호로 설정해주세요.");
```

- [ ] **Step 2: 실패하는 통합 테스트 작성**

Create `backend/src/test/java/com/twochi/user/PasswordChangeIntegrationTest.java`:

```java
package com.twochi.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class PasswordChangeIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();

        Map<String, Object> signup = Map.of(
            "email", "alice@example.com",
            "password", "OldPass1!",
            "nickname", "alice",
            "ageConfirmed", true,
            "consents", Map.of("terms", true, "privacy", true, "marketing", false)
        );
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(signup)));

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "alice@example.com", "password", "OldPass1!"))))
            .andReturn();
        JsonNode body = om.readTree(login.getResponse().getContentAsString());
        accessToken = body.get("accessToken").asText();
        userId = userRepository.findByEmailAndDeletedAtIsNull("alice@example.com").orElseThrow().getId();
    }

    @AfterEach
    void tearDown() {
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void changePassword_validInput_updatesHashAndChangedAt() throws Exception {
        var beforeChangedAt = userRepository.findById(userId).orElseThrow().getPasswordChangedAt();

        mockMvc.perform(patch("/api/v1/users/me/password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "OldPass1!",
                    "newPassword", "NewPass2!"
                ))))
            .andExpect(status().isNoContent());

        var user = userRepository.findById(userId).orElseThrow();
        assertThat(passwordEncoder.matches("NewPass2!", user.getPasswordHash())).isTrue();
        assertThat(user.getPasswordChangedAt()).isAfter(beforeChangedAt);
    }

    @Test
    void changePassword_wrongCurrent_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "WrongPass!",
                    "newPassword", "NewPass2!"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("PASSWORD_MISMATCH"));
    }

    @Test
    void changePassword_sameAsCurrent_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "OldPass1!",
                    "newPassword", "OldPass1!"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("PASSWORD_UNCHANGED"));
    }

    @Test
    void changePassword_blankNewPassword_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "OldPass1!",
                    "newPassword", ""
                ))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void changePassword_unauthenticated_returns401() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "currentPassword", "x",
                    "newPassword", "y"
                ))))
            .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.PasswordChangeIntegrationTest" 2>&1 | tail -20
```

Expected: PATCH /api/v1/users/me/password 가 없어서 FAIL.

- [ ] **Step 4: ChangePasswordRequest DTO 작성**

Create `backend/src/main/java/com/twochi/user/dto/ChangePasswordRequest.java`:

```java
package com.twochi.user.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(

    @NotBlank String currentPassword,
    @NotBlank String newPassword

) {}
```

(signup 과 같이 v1 클로즈드 베타 정책 — @NotBlank 만. 회원가입과 같은 규칙 유지.)

- [ ] **Step 5: PasswordChangeService 작성**

Create `backend/src/main/java/com/twochi/user/service/PasswordChangeService.java`:

```java
package com.twochi.user.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class PasswordChangeService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordChangeService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void change(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
        }
        if (currentPassword.equals(newPassword)) {
            throw new BusinessException(ErrorCode.PASSWORD_UNCHANGED);
        }

        String newHash = passwordEncoder.encode(newPassword);
        user.changePassword(newHash, Instant.now());
        userRepository.save(user);
    }
}
```

- [ ] **Step 6: UserController 에 PATCH /me/password 추가**

Modify `backend/src/main/java/com/twochi/user/controller/UserController.java` — 필드/생성자/메서드 추가. 다음 형태가 되도록:

```java
    private final UserQueryService userQueryService;
    private final UserProfileUpdateService userProfileUpdateService;
    private final PasswordChangeService passwordChangeService;

    public UserController(UserQueryService userQueryService,
                          UserProfileUpdateService userProfileUpdateService,
                          PasswordChangeService passwordChangeService) {
        this.userQueryService = userQueryService;
        this.userProfileUpdateService = userProfileUpdateService;
        this.passwordChangeService = passwordChangeService;
    }

    // ... 기존 GET /me, PATCH /me ...

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody ChangePasswordRequest req) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        passwordChangeService.change(principal.userId(), req.currentPassword(), req.newPassword());
        return ResponseEntity.noContent().build();
    }
```

신규 import:
```java
import com.twochi.user.dto.ChangePasswordRequest;
import com.twochi.user.service.PasswordChangeService;
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.PasswordChangeIntegrationTest"
```

Expected: 5 tests passed.

- [ ] **Step 8: 전체 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test
```

Expected: 모든 테스트 통과.

- [ ] **Step 9: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/common/exception/ErrorCode.java \
    backend/src/main/java/com/twochi/user/dto/ChangePasswordRequest.java \
    backend/src/main/java/com/twochi/user/service/PasswordChangeService.java \
    backend/src/main/java/com/twochi/user/controller/UserController.java \
    backend/src/test/java/com/twochi/user/PasswordChangeIntegrationTest.java
git commit -m "$(cat <<'EOF'
feat(mp-be): PATCH /api/v1/users/me/password — 비밀번호 변경

- ChangePasswordRequest DTO (currentPassword + newPassword, NotBlank only — v1 정책)
- PasswordChangeService.change — currentPassword 검증 + 새 해시 + password_changed_at 갱신
- ErrorCode: PASSWORD_MISMATCH, PASSWORD_UNCHANGED 추가
- 통합 테스트 5건 (정상 / 현재 비번 틀림 / 동일 비번 / 공백 / 미인증)

알려진 한계: JWT revocation 미구현. 비밀번호 변경 후에도 기존 access token 은
만료(~15분) 까지 유효. FE 가 변경 성공 시 자체 로그아웃 유도 (PR description).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: DELETE /api/v1/users/me — 탈퇴 + Login/Refresh 차단

**Files:**
- Modify: `backend/src/main/java/com/twochi/common/exception/ErrorCode.java`
- Create: `backend/src/main/java/com/twochi/user/dto/WithdrawRequest.java`
- Create: `backend/src/main/java/com/twochi/user/service/AccountClosureService.java`
- Modify: `backend/src/main/java/com/twochi/user/controller/UserController.java`
- Modify: `backend/src/main/java/com/twochi/user/repository/UserRepository.java`
- Modify: `backend/src/main/java/com/twochi/auth/service/LoginService.java`
- Modify: `backend/src/main/java/com/twochi/auth/service/RefreshTokenService.java`
- Create: `backend/src/test/java/com/twochi/user/AccountClosureIntegrationTest.java`

- [ ] **Step 1: ErrorCode 3개 추가**

Modify `backend/src/main/java/com/twochi/common/exception/ErrorCode.java` — Task 3 에서 추가한 줄들 뒤에 추가:

```java
    PASSWORD_UNCHANGED(HttpStatus.BAD_REQUEST, "현재 비밀번호와 동일해요. 다른 비밀번호로 설정해주세요."),
    USER_WITHDRAWN(HttpStatus.GONE, "탈퇴된 계정입니다."),
    USER_WITHDRAWN_GRACE(HttpStatus.GONE, "탈퇴된 계정입니다. 30일 유예 기간 내에 복구 가능해요."),
    ALREADY_WITHDRAWN(HttpStatus.CONFLICT, "이미 탈퇴 처리됐어요.");
```

- [ ] **Step 2: UserRepository 에 `findByEmail` 추가**

Modify `backend/src/main/java/com/twochi/user/repository/UserRepository.java`:

```java
package com.twochi.user.repository;

import com.twochi.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmailAndDeletedAtIsNull(String email);

    boolean existsByNicknameAndDeletedAtIsNull(String nickname);

    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    Optional<User> findByEmail(String email);
}
```

- [ ] **Step 3: 실패하는 통합 테스트 작성**

Create `backend/src/test/java/com/twochi/user/AccountClosureIntegrationTest.java`:

```java
package com.twochi.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class AccountClosureIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;
    private String refreshTokenCookie;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
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
        var setCookie = login.getResponse().getHeader("Set-Cookie");
        refreshTokenCookie = setCookie == null ? null : setCookie.split(";")[0]; // refresh=xxx
        userId = userRepository.findByEmailAndDeletedAtIsNull("alice@example.com").orElseThrow().getId();
    }

    @AfterEach
    void tearDown() {
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void withdraw_validPassword_setsDeletedAt() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isNoContent());

        var user = userRepository.findById(userId).orElseThrow();
        assertThat(user.getDeletedAt()).isNotNull();
    }

    @Test
    void withdraw_wrongPassword_returns400() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "WrongPass!"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("PASSWORD_MISMATCH"));

        assertThat(userRepository.findById(userId).orElseThrow().getDeletedAt()).isNull();
    }

    @Test
    void withdraw_alreadyWithdrawn_returns409() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isNoContent());

        // 두 번째 호출 — 동일 토큰(아직 만료 전) 으로 (filter 는 deleted_at 체크 안 함, controller 의 service 가 ALREADY_WITHDRAWN 던짐)
        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("ALREADY_WITHDRAWN"));
    }

    @Test
    void withdraw_thenLogin_returns410WithdrawnGrace() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("email", "alice@example.com", "password", "Pass1234!"))))
            .andExpect(status().isGone())
            .andExpect(jsonPath("$.code").value("USER_WITHDRAWN_GRACE"));
    }

    @Test
    void withdraw_thenRefresh_returns410WithdrawnGrace() throws Exception {
        org.junit.jupiter.api.Assumptions.assumeTrue(refreshTokenCookie != null, "no refresh cookie issued");

        mockMvc.perform(delete("/api/v1/users/me")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/refresh").header("Cookie", refreshTokenCookie))
            .andExpect(status().isGone())
            .andExpect(jsonPath("$.code").value("USER_WITHDRAWN_GRACE"));
    }

    @Test
    void withdraw_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of("currentPassword", "Pass1234!"))))
            .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 4: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.AccountClosureIntegrationTest" 2>&1 | tail -30
```

Expected: 다수 FAIL.

- [ ] **Step 5: WithdrawRequest DTO**

Create `backend/src/main/java/com/twochi/user/dto/WithdrawRequest.java`:

```java
package com.twochi.user.dto;

import jakarta.validation.constraints.NotBlank;

public record WithdrawRequest(

    @NotBlank String currentPassword

) {}
```

- [ ] **Step 6: AccountClosureService**

Create `backend/src/main/java/com/twochi/user/service/AccountClosureService.java`:

```java
package com.twochi.user.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AccountClosureService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountClosureService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void close(Long userId, String currentPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));

        if (user.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.ALREADY_WITHDRAWN);
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
        }

        user.withdraw(Instant.now());
        userRepository.save(user);
    }
}
```

- [ ] **Step 7: UserController 에 DELETE /me 추가**

Modify `backend/src/main/java/com/twochi/user/controller/UserController.java` — 필드/생성자에 `AccountClosureService` 추가하고 메서드 추가:

```java
    private final AccountClosureService accountClosureService;

    public UserController(UserQueryService userQueryService,
                          UserProfileUpdateService userProfileUpdateService,
                          PasswordChangeService passwordChangeService,
                          AccountClosureService accountClosureService) {
        // 기존 4 라인 + 다음 한 줄
        this.accountClosureService = accountClosureService;
    }

    // ...

    @DeleteMapping("/me")
    public ResponseEntity<Void> withdraw(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody WithdrawRequest req) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        accountClosureService.close(principal.userId(), req.currentPassword());
        return ResponseEntity.noContent().build();
    }
```

신규 import:
```java
import com.twochi.user.dto.WithdrawRequest;
import com.twochi.user.service.AccountClosureService;
import org.springframework.web.bind.annotation.DeleteMapping;
```

- [ ] **Step 8: LoginService 의 deleted_at 분기 추가**

Modify `backend/src/main/java/com/twochi/auth/service/LoginService.java` — `login(LoginRequest req)` 메서드의 첫 줄(User user = userRepository.findByEmailAndDeletedAtIsNull(...)) 을 다음으로 교체:

```java
    @Transactional(noRollbackFor = BusinessException.class)
    public LoginResult login(LoginRequest req) {
        Instant now = Instant.now();

        User user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (user.getDeletedAt() != null) {
            Instant graceUntil = user.getDeletedAt().plus(java.time.Duration.ofDays(30));
            if (now.isBefore(graceUntil)) {
                throw new BusinessException(ErrorCode.USER_WITHDRAWN_GRACE);
            }
            throw new BusinessException(ErrorCode.USER_WITHDRAWN);
        }

        // 기존 흐름 (locked 체크부터) 그대로 진행
        if (user.isLocked(now)) {
            // ...
        }
        // ...
    }
```

(주의: `findByEmailAndDeletedAtIsNull` 호출을 `findByEmail` 로 변경하는 것이 핵심. 변경 전 deleted user 는 INVALID_CREDENTIALS 를 받았는데, 이제 USER_WITHDRAWN_GRACE 를 받아야 한다.)

- [ ] **Step 9: RefreshTokenService 의 deleted_at 분기 추가**

`backend/src/main/java/com/twochi/auth/service/RefreshTokenService.java` 의 refresh 메서드를 읽고, user 를 로드하는 부분 직후에 다음 체크 추가:

```java
if (user.getDeletedAt() != null) {
    throw new BusinessException(ErrorCode.USER_WITHDRAWN_GRACE);
}
```

(이 task 의 실행자는 먼저 `RefreshTokenService.java` 의 refresh 흐름을 읽어보고, user 로드 직후 위 분기를 삽입한다. 분기 위치는 LoginService 패턴과 같음 — token 검증 후, 새 access token 발급 전.)

- [ ] **Step 10: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.AccountClosureIntegrationTest"
```

Expected: 6 tests passed (refresh 케이스는 `assumeTrue` 로 skip 될 수 있음).

- [ ] **Step 11: 전체 회귀 (LoginService 변경의 사이드 이펙트 확인)**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test
```

Expected: 모든 테스트 통과. 특히 기존 `LoginIntegrationTest` 가 회귀 0 인지 확인. (deleted 가 아닌 정상 사용자는 동일 동작)

- [ ] **Step 12: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/common/exception/ErrorCode.java \
    backend/src/main/java/com/twochi/user/dto/WithdrawRequest.java \
    backend/src/main/java/com/twochi/user/service/AccountClosureService.java \
    backend/src/main/java/com/twochi/user/controller/UserController.java \
    backend/src/main/java/com/twochi/user/repository/UserRepository.java \
    backend/src/main/java/com/twochi/auth/service/LoginService.java \
    backend/src/main/java/com/twochi/auth/service/RefreshTokenService.java \
    backend/src/test/java/com/twochi/user/AccountClosureIntegrationTest.java
git commit -m "$(cat <<'EOF'
feat(mp-be): DELETE /api/v1/users/me + Login/Refresh 차단

- WithdrawRequest DTO + AccountClosureService — currentPassword 검증 + deleted_at 세팅
- DELETE /api/v1/users/me 매핑 (UserController)
- LoginService: findByEmailAndDeletedAtIsNull → findByEmail 로 변경 + deleted_at 분기
  (탈퇴 사용자는 USER_WITHDRAWN_GRACE 410 응답, 30일 경과 시 USER_WITHDRAWN)
- RefreshTokenService: refresh 시 user.deleted_at 체크
- UserRepository: findByEmail 추가 (deleted 포함)
- ErrorCode: USER_WITHDRAWN, USER_WITHDRAWN_GRACE, ALREADY_WITHDRAWN 추가
- 통합 테스트 6건 (정상 / 비번 틀림 / 이미 탈퇴 / 로그인 차단 / refresh 차단 / 미인증)

소유 데이터 cascade soft delete 없음 — FK ON DELETE CASCADE 가 v2 hard delete cron 에서 처리.
JwtAuthenticationFilter 는 claims-only 유지 — 탈퇴 직후 기존 access token 은
만료(~15분) 까지 유효하나 refresh 차단으로 access window 캡.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: NotiSettingDef enum + UserNotiSetting 엔티티 + Repository

**Files:**
- Create: `backend/src/main/java/com/twochi/user/domain/noti/NotiSettingDef.java`
- Create: `backend/src/main/java/com/twochi/user/domain/UserNotiSetting.java`
- Create: `backend/src/main/java/com/twochi/user/domain/UserNotiSettingId.java`
- Create: `backend/src/main/java/com/twochi/user/repository/UserNotiSettingRepository.java`

이 task 는 데이터 모델만 — 통합 테스트는 Task 6 에서 GET endpoint 와 함께.

- [ ] **Step 1: NotiSettingDef enum**

Create `backend/src/main/java/com/twochi/user/domain/noti/NotiSettingDef.java`:

```java
package com.twochi.user.domain.noti;

import java.util.Optional;

/**
 * 알림 설정 정의 — frontend mock NOTI_SETTINGS_MOCK 과 1:1 대응.
 * `id` 는 FE 와 합의된 stable key (DB 의 setting_id 컬럼 값).
 */
public enum NotiSettingDef {

    DEADLINE_D3("deadline-d3", "전형 일정 · 마감", "채용공고 마감 D-3", "마감 3일 전 09:00에 받기", true, false),
    DEADLINE_D1("deadline-d1", "전형 일정 · 마감", "채용공고 마감 D-1", "마감 1일 전 09:00에 받기", true, false),
    INTERVIEW_D1("interview-d1", "전형 일정 · 마감", "면접·일정 D-1", "등록한 일정 하루 전 09:00에 받기", true, false),
    CL_UNSUBMITTED("cl-unsubmitted", "전형 일정 · 마감", "자소서 저장 후 미제출 7일", "저장하고 제출하지 않은 자소서가 있을 때", false, false),

    WEEKLY_SUMMARY("weekly-summary", "제품 안내", "주간 요약", "이번 주 자소서·지원 현황 요약 (매주 월요일 09:00)", false, false),
    NEW_FEATURE("new-feature", "제품 안내", "신기능 안내", "새로 추가된 기능·업데이트 소식", true, false),
    EVENT_PROMO("event-promo", "제품 안내", "이벤트 · 프로모션", "할인·이벤트 안내", false, false),

    SIGNUP_VERIFY("signup-verify", "계정 보안", "회원가입 인증", "가입 직후 이메일 인증 코드 발송", true, true),
    PW_RESET("pw-reset", "계정 보안", "비밀번호 재설정", "비밀번호 재설정 요청 시 발송", true, true),
    NEW_DEVICE("new-device", "계정 보안", "새 기기 로그인 감지", "등록되지 않은 기기에서 로그인 시 안내", true, true),

    CHANNEL_EMAIL("channel-email", "알림 채널", "이메일 알림", "가장 안정적인 채널 · 발송 후 30일간 보관", true, false),
    CHANNEL_PUSH("channel-push", "알림 채널", "웹푸시 알림", "브라우저 알림 권한이 필요해요", false, false);

    private final String id;
    private final String category;
    private final String label;
    private final String description;
    private final boolean defaultOn;
    private final boolean locked;

    NotiSettingDef(String id, String category, String label, String description, boolean defaultOn, boolean locked) {
        this.id = id;
        this.category = category;
        this.label = label;
        this.description = description;
        this.defaultOn = defaultOn;
        this.locked = locked;
    }

    public String id() { return id; }
    public String category() { return category; }
    public String label() { return label; }
    public String description() { return description; }
    public boolean defaultOn() { return defaultOn; }
    public boolean locked() { return locked; }

    public static Optional<NotiSettingDef> fromId(String id) {
        for (NotiSettingDef d : values()) {
            if (d.id.equals(id)) return Optional.of(d);
        }
        return Optional.empty();
    }
}
```

- [ ] **Step 2: UserNotiSettingId (composite PK)**

Create `backend/src/main/java/com/twochi/user/domain/UserNotiSettingId.java`:

```java
package com.twochi.user.domain;

import java.io.Serializable;
import java.util.Objects;

public class UserNotiSettingId implements Serializable {

    private Long userId;
    private String settingId;

    public UserNotiSettingId() {}

    public UserNotiSettingId(Long userId, String settingId) {
        this.userId = userId;
        this.settingId = settingId;
    }

    public Long getUserId() { return userId; }
    public String getSettingId() { return settingId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserNotiSettingId other)) return false;
        return Objects.equals(userId, other.userId) && Objects.equals(settingId, other.settingId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, settingId);
    }
}
```

- [ ] **Step 3: UserNotiSetting 엔티티**

Create `backend/src/main/java/com/twochi/user/domain/UserNotiSetting.java`:

```java
package com.twochi.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "user_noti_setting")
@IdClass(UserNotiSettingId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserNotiSetting {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "setting_id", length = 40)
    private String settingId;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    private UserNotiSetting(Long userId, String settingId, boolean enabled, Instant now) {
        this.userId = userId;
        this.settingId = settingId;
        this.enabled = enabled;
        this.updatedAt = now;
    }

    public static UserNotiSetting of(Long userId, String settingId, boolean enabled, Instant now) {
        return new UserNotiSetting(userId, settingId, enabled, now);
    }

    public void updateEnabled(boolean enabled, Instant now) {
        this.enabled = enabled;
        this.updatedAt = now;
    }
}
```

- [ ] **Step 4: UserNotiSettingRepository**

Create `backend/src/main/java/com/twochi/user/repository/UserNotiSettingRepository.java`:

```java
package com.twochi.user.repository;

import com.twochi.user.domain.UserNotiSetting;
import com.twochi.user.domain.UserNotiSettingId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserNotiSettingRepository extends JpaRepository<UserNotiSetting, UserNotiSettingId> {

    List<UserNotiSetting> findAllByUserId(Long userId);

    Optional<UserNotiSetting> findByUserIdAndSettingId(Long userId, String settingId);

    void deleteByUserIdAndSettingId(Long userId, String settingId);
}
```

- [ ] **Step 5: 컴파일 통과 확인 (이 task 는 read-only enum/entity 라 통합 테스트 없음)**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: 전체 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test
```

Expected: 모든 테스트 통과 (이 task 가 어떤 기존 테스트도 깨면 안 됨).

- [ ] **Step 7: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/user/domain/noti/NotiSettingDef.java \
    backend/src/main/java/com/twochi/user/domain/UserNotiSetting.java \
    backend/src/main/java/com/twochi/user/domain/UserNotiSettingId.java \
    backend/src/main/java/com/twochi/user/repository/UserNotiSettingRepository.java
git commit -m "$(cat <<'EOF'
feat(mp-be): NotiSettingDef enum + UserNotiSetting 엔티티 + repository

- NotiSettingDef enum 12개 정의 (frontend NOTI_SETTINGS_MOCK 과 1:1 대응)
- UserNotiSetting 엔티티 (sparse override 저장, (user_id, setting_id) composite PK)
- UserNotiSettingId composite key 클래스
- UserNotiSettingRepository — findAllByUserId / findByUserIdAndSettingId / delete

setting_id 키는 frontend 와 합의된 kebab-case 문자열 (enum 이름 변경과 분리).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: GET /api/v1/users/me/noti-settings

**Files:**
- Create: `backend/src/main/java/com/twochi/user/dto/NotiSettingItem.java`
- Create: `backend/src/main/java/com/twochi/user/dto/NotiSettingsResponse.java`
- Create: `backend/src/main/java/com/twochi/user/service/noti/NotiSettingService.java`
- Create: `backend/src/main/java/com/twochi/user/controller/NotiSettingsController.java`
- Create: `backend/src/test/java/com/twochi/user/NotiSettingsIntegrationTest.java`

- [ ] **Step 1: 실패하는 통합 테스트 작성 (GET 시나리오)**

Create `backend/src/test/java/com/twochi/user/NotiSettingsIntegrationTest.java`:

```java
package com.twochi.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserNotiSettingRepository;
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

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
class NotiSettingsIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper om;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsentLogRepository consentLogRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private UserNotiSettingRepository notiSettingRepository;
    @Autowired private RedisConnectionFactory redis;

    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        notiSettingRepository.deleteAll();
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
    }

    @AfterEach
    void tearDown() {
        notiSettingRepository.deleteAll();
        profileRepository.deleteAll();
        consentLogRepository.deleteAll();
        userRepository.deleteAll();
        redis.getConnection().serverCommands().flushDb();
    }

    @Test
    void getNotiSettings_noOverride_returnsDefaults() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/noti-settings")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.settings.length()").value(12))
            .andExpect(jsonPath("$.settings[?(@.id == 'deadline-d3')].enabled").value(true))
            .andExpect(jsonPath("$.settings[?(@.id == 'weekly-summary')].enabled").value(false))
            .andExpect(jsonPath("$.settings[?(@.id == 'signup-verify')].locked").value(true))
            .andExpect(jsonPath("$.settings[?(@.id == 'signup-verify')].enabled").value(true));
    }

    @Test
    void getNotiSettings_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/noti-settings"))
            .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.NotiSettingsIntegrationTest" 2>&1 | tail -20
```

Expected: 404 또는 컴파일 에러로 FAIL.

- [ ] **Step 3: NotiSettingItem DTO**

Create `backend/src/main/java/com/twochi/user/dto/NotiSettingItem.java`:

```java
package com.twochi.user.dto;

public record NotiSettingItem(
    String id,
    String category,
    String label,
    String description,
    boolean enabled,
    boolean locked
) {}
```

- [ ] **Step 4: NotiSettingsResponse DTO**

Create `backend/src/main/java/com/twochi/user/dto/NotiSettingsResponse.java`:

```java
package com.twochi.user.dto;

import java.util.List;

public record NotiSettingsResponse(List<NotiSettingItem> settings) {}
```

- [ ] **Step 5: NotiSettingService — read 메서드**

Create `backend/src/main/java/com/twochi/user/service/noti/NotiSettingService.java`:

```java
package com.twochi.user.service.noti;

import com.twochi.user.domain.UserNotiSetting;
import com.twochi.user.domain.noti.NotiSettingDef;
import com.twochi.user.dto.NotiSettingItem;
import com.twochi.user.dto.NotiSettingsResponse;
import com.twochi.user.repository.UserNotiSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotiSettingService {

    private final UserNotiSettingRepository repository;

    public NotiSettingService(UserNotiSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public NotiSettingsResponse list(Long userId) {
        Map<String, Boolean> overrides = new HashMap<>();
        for (UserNotiSetting s : repository.findAllByUserId(userId)) {
            overrides.put(s.getSettingId(), s.isEnabled());
        }

        List<NotiSettingItem> items = new java.util.ArrayList<>();
        for (NotiSettingDef def : NotiSettingDef.values()) {
            boolean enabled = def.locked()
                ? def.defaultOn()                                       // locked 는 override 불가
                : overrides.getOrDefault(def.id(), def.defaultOn());
            items.add(new NotiSettingItem(def.id(), def.category(), def.label(), def.description(), enabled, def.locked()));
        }
        return new NotiSettingsResponse(items);
    }
}
```

- [ ] **Step 6: NotiSettingsController — GET 매핑**

Create `backend/src/main/java/com/twochi/user/controller/NotiSettingsController.java`:

```java
package com.twochi.user.controller;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.dto.NotiSettingsResponse;
import com.twochi.user.service.noti.NotiSettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/noti-settings")
public class NotiSettingsController {

    private final NotiSettingService notiSettingService;

    public NotiSettingsController(NotiSettingService notiSettingService) {
        this.notiSettingService = notiSettingService;
    }

    @GetMapping
    public ResponseEntity<NotiSettingsResponse> list(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(notiSettingService.list(principal.userId()));
    }
}
```

- [ ] **Step 7: 테스트 통과 확인 (GET 만)**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.NotiSettingsIntegrationTest"
```

Expected: 2 tests passed (이 task 에 있는 2개 — PATCH 시나리오는 Task 7 에서 추가).

- [ ] **Step 8: 전체 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test
```

Expected: 모든 테스트 통과.

- [ ] **Step 9: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/user/dto/NotiSettingItem.java \
    backend/src/main/java/com/twochi/user/dto/NotiSettingsResponse.java \
    backend/src/main/java/com/twochi/user/service/noti/NotiSettingService.java \
    backend/src/main/java/com/twochi/user/controller/NotiSettingsController.java \
    backend/src/test/java/com/twochi/user/NotiSettingsIntegrationTest.java
git commit -m "$(cat <<'EOF'
feat(mp-be): GET /api/v1/users/me/noti-settings — 12 default + override 머지

- NotiSettingsResponse / NotiSettingItem DTO
- NotiSettingService.list — enum 12 정의 + DB sparse override 머지
- NotiSettingsController GET 매핑
- 통합 테스트 2건 (default 12개 반환 / 미인증)

locked 3개(계정 보안)는 항상 enum 의 defaultOn 사용 (DB override 무시).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: PATCH /api/v1/users/me/noti-settings

**Files:**
- Modify: `backend/src/main/java/com/twochi/common/exception/ErrorCode.java`
- Create: `backend/src/main/java/com/twochi/user/dto/UpdateNotiSettingsRequest.java`
- Modify: `backend/src/main/java/com/twochi/user/service/noti/NotiSettingService.java`
- Modify: `backend/src/main/java/com/twochi/user/controller/NotiSettingsController.java`
- Modify: `backend/src/test/java/com/twochi/user/NotiSettingsIntegrationTest.java`

- [ ] **Step 1: ErrorCode 2개 추가**

Modify `backend/src/main/java/com/twochi/common/exception/ErrorCode.java` — 마지막 줄에 추가:

```java
    ALREADY_WITHDRAWN(HttpStatus.CONFLICT, "이미 탈퇴 처리됐어요."),
    SETTING_LOCKED(HttpStatus.BAD_REQUEST, "보안 알림은 변경할 수 없어요."),
    UNKNOWN_SETTING(HttpStatus.BAD_REQUEST, "알 수 없는 알림 설정이에요.");
```

- [ ] **Step 2: NotiSettingsIntegrationTest 확장 (PATCH 시나리오 추가)**

Modify `backend/src/test/java/com/twochi/user/NotiSettingsIntegrationTest.java` — 기존 클래스에 다음 테스트 메서드 추가:

```java
    @Test
    void patchNotiSettings_singleOverride_persisted() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/noti-settings")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "overrides", List.of(Map.of("id", "deadline-d3", "enabled", false))
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.settings[?(@.id == 'deadline-d3')].enabled").value(false));

        // GET 으로 다시 확인
        mockMvc.perform(get("/api/v1/users/me/noti-settings")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.settings[?(@.id == 'deadline-d3')].enabled").value(false));
    }

    @Test
    void patchNotiSettings_setBackToDefault_removesRow() throws Exception {
        // 1. default 와 다른 값으로 override (deadline-d3 default=true → false)
        mockMvc.perform(patch("/api/v1/users/me/noti-settings")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "overrides", List.of(Map.of("id", "deadline-d3", "enabled", false))
                ))))
            .andExpect(status().isOk());

        org.assertj.core.api.Assertions.assertThat(notiSettingRepository.findAll()).hasSize(1);

        // 2. default 로 되돌림 (deadline-d3 default=true)
        mockMvc.perform(patch("/api/v1/users/me/noti-settings")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "overrides", List.of(Map.of("id", "deadline-d3", "enabled", true))
                ))))
            .andExpect(status().isOk());

        // row 가 삭제되어야 함 (sparse 유지)
        org.assertj.core.api.Assertions.assertThat(notiSettingRepository.findAll()).isEmpty();
    }

    @Test
    void patchNotiSettings_lockedItem_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/noti-settings")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "overrides", List.of(Map.of("id", "signup-verify", "enabled", false))
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("SETTING_LOCKED"));
    }

    @Test
    void patchNotiSettings_unknownId_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/noti-settings")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "overrides", List.of(Map.of("id", "nonexistent-key", "enabled", true))
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("UNKNOWN_SETTING"));
    }
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.NotiSettingsIntegrationTest" 2>&1 | tail -30
```

Expected: PATCH 매핑 없음으로 405 또는 404 FAIL.

- [ ] **Step 4: UpdateNotiSettingsRequest DTO**

Create `backend/src/main/java/com/twochi/user/dto/UpdateNotiSettingsRequest.java`:

```java
package com.twochi.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateNotiSettingsRequest(

    @NotNull
    @Valid
    List<Item> overrides

) {
    public record Item(
        @NotBlank String id,
        @NotNull Boolean enabled
    ) {}
}
```

- [ ] **Step 5: NotiSettingService 에 `update` 메서드 추가**

Modify `backend/src/main/java/com/twochi/user/service/noti/NotiSettingService.java` — list 메서드 뒤에 추가:

```java
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.dto.UpdateNotiSettingsRequest;

// ...

@Transactional
public NotiSettingsResponse update(Long userId, List<UpdateNotiSettingsRequest.Item> overrides) {
    Instant now = Instant.now();

    // 1. 모든 항목 검증 — 하나라도 잘못되면 변경 없음
    for (UpdateNotiSettingsRequest.Item item : overrides) {
        NotiSettingDef def = NotiSettingDef.fromId(item.id())
            .orElseThrow(() -> new BusinessException(ErrorCode.UNKNOWN_SETTING));
        if (def.locked()) {
            throw new BusinessException(ErrorCode.SETTING_LOCKED);
        }
    }

    // 2. 처리: default 와 같으면 row 삭제, 다르면 upsert
    for (UpdateNotiSettingsRequest.Item item : overrides) {
        NotiSettingDef def = NotiSettingDef.fromId(item.id()).orElseThrow();
        boolean enabled = item.enabled();
        if (enabled == def.defaultOn()) {
            repository.deleteByUserIdAndSettingId(userId, def.id());
        } else {
            UserNotiSetting existing = repository.findByUserIdAndSettingId(userId, def.id()).orElse(null);
            if (existing == null) {
                repository.save(UserNotiSetting.of(userId, def.id(), enabled, now));
            } else {
                existing.updateEnabled(enabled, now);
                repository.save(existing);
            }
        }
    }

    return list(userId);
}
```

신규 import (이미 있는 것들은 무시):
```java
import java.time.Instant;
```

- [ ] **Step 6: NotiSettingsController 에 PATCH 추가**

Modify `backend/src/main/java/com/twochi/user/controller/NotiSettingsController.java`:

```java
    @PatchMapping
    public ResponseEntity<NotiSettingsResponse> update(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody UpdateNotiSettingsRequest req) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        return ResponseEntity.ok(notiSettingService.update(principal.userId(), req.overrides()));
    }
```

신규 import:
```java
import com.twochi.user.dto.UpdateNotiSettingsRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test --tests "com.twochi.user.NotiSettingsIntegrationTest"
```

Expected: 6 tests passed (GET 2 + PATCH 4).

- [ ] **Step 8: 전체 회귀**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew test
```

Expected: 모든 테스트 통과.

- [ ] **Step 9: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add backend/src/main/java/com/twochi/common/exception/ErrorCode.java \
    backend/src/main/java/com/twochi/user/dto/UpdateNotiSettingsRequest.java \
    backend/src/main/java/com/twochi/user/service/noti/NotiSettingService.java \
    backend/src/main/java/com/twochi/user/controller/NotiSettingsController.java \
    backend/src/test/java/com/twochi/user/NotiSettingsIntegrationTest.java
git commit -m "$(cat <<'EOF'
feat(mp-be): PATCH /api/v1/users/me/noti-settings — sparse override upsert

- UpdateNotiSettingsRequest DTO ({ overrides: [{id, enabled}] })
- NotiSettingService.update — validate-all-or-none → sparse upsert
  default 와 같은 값이면 row 삭제, 다르면 upsert
- NotiSettingsController PATCH 매핑
- ErrorCode: SETTING_LOCKED, UNKNOWN_SETTING 추가
- 통합 테스트 4건 (단일 override / default 로 되돌리면 row 삭제 / locked / 알 수 없는 id)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: 최종 검증 + PR 생성

**Files:** (변경 없음, 검증만)

- [ ] **Step 1: develop 최신과 rebase (다른 사람이 push 했을 가능성 대비)**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git fetch origin
git rebase origin/develop
```

Expected: `Successfully rebased and updated` 또는 충돌 없음.

- [ ] **Step 2: 전체 build + 테스트**

```bash
cd /Users/sungjiwon/claude/2chi_v1/backend && ./gradlew clean build
```

Expected: BUILD SUCCESSFUL. 신규 테스트 5 파일 + 기존 전체 통과.

- [ ] **Step 3: 수동 sanity check (선택, dev DB 가 떠있을 경우)**

```bash
cd /Users/sungjiwon/claude/2chi_v1 && docker-compose up -d postgres redis
cd backend && ./gradlew bootRun &
SERVER_PID=$!
sleep 15
```

curl 로 6 endpoint 한 번씩 호출:
```bash
# (이미 가입한 사용자가 있다고 가정. 없으면 signup 부터)
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Pass1234!"}' | jq -r .accessToken)

curl -s http://localhost:8080/api/v1/users/me -H "Authorization: Bearer $TOKEN" | jq
curl -s -X PATCH http://localhost:8080/api/v1/users/me -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nickname":"new_nick"}' | jq
curl -s http://localhost:8080/api/v1/users/me/noti-settings -H "Authorization: Bearer $TOKEN" | jq '.settings | length'  # → 12
curl -s -X PATCH http://localhost:8080/api/v1/users/me/noti-settings -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"overrides":[{"id":"weekly-summary","enabled":true}]}' | jq

kill $SERVER_PID
```

Expected: 6 endpoint 모두 정상 응답. 5.2~5.6 spec 의 동작과 일치.

- [ ] **Step 4: push + PR 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git push -u origin feat/mypage-be-pr-a
gh pr create --base develop --title "feat(mp-be): mypage BE PR A — account · noti-settings · withdraw" --body "$(cat <<'EOF'
## Summary

mypage cluster 5 endpoint 중 3개의 BE 구현 (FE PR #23 의 UI mock-only 가 실 API 로 동작 가능).

- `GET /api/v1/users/me` — 응답 shape 확장 (`joinedAt`/`passwordChangedAt`/`plan`)
- `PATCH /api/v1/users/me` — 닉네임 변경
- `PATCH /api/v1/users/me/password` — 비밀번호 변경 (`currentPassword` 검증 필수)
- `DELETE /api/v1/users/me` — 탈퇴 (`currentPassword` 검증 필수, `deleted_at` 만 세팅)
- `GET /api/v1/users/me/noti-settings` — 12 default + sparse override 머지
- `PATCH /api/v1/users/me/noti-settings` — sparse upsert (default 와 같으면 row 삭제)

## 핵심 결정 (spec 참조)

- **withdraw 시맨틱**: `user.deleted_at` 만 세팅, owned data 미터치. FK ON DELETE CASCADE 가 v2 cron 의 hard delete 시점에 자동 처리
- **Login/Refresh 차단**: `LoginService` 의 `findByEmailAndDeletedAtIsNull` → `findByEmail` 로 변경 + `deleted_at` 분기. `RefreshTokenService` 도 동일 체크. `JwtAuthenticationFilter` 는 claims-only 유지 (DB hit 회피)
- **noti-settings 저장**: 별도 sparse 테이블 `user_noti_setting` — default 와 다른 항목만 row. 정의 12개는 코드 enum
- **`password_changed_at` 컬럼 신규** + 기존 사용자 `created_at` 으로 backfill

## Known Limitations (v2 backlog)

- **PII 익명화 + 30일 hard delete cron** — v1 데모/소규모 운영 맥락에서 30일 PII 보존 acceptable (PIPA "지체 없이" 의 운영 사유 통상 인정)
- **restore (탈퇴 후 30일 내 다시 로그인 복구)** — v2 cron 작업에 같이
- **JWT revocation** — 탈퇴 후 기존 access token 은 만료(~15분) 까지 유효. refresh 차단으로 access window 자연 캡. 비밀번호 변경 후에도 옛 토큰은 만료 전까지 유효 → FE 가 변경 직후 자체 로그아웃 유도
- **이메일 변경** — 새 메일 인증 인프라 필요 (v2 OAuth 와 같이)
- **social 4 provider 연결** — v2 OAuth issue
- **noti-center** — 별도 PR B (notification 테이블 + 도메인 cross-cutting producer)

## Test plan

- [x] `./gradlew test` 전체 통과 (회귀 0)
- [x] 신규 통합 테스트 4 파일 (UserProfile / PasswordChange / AccountClosure / NotiSettings) 통과
- [x] 기존 MeIntegrationTest 갱신 — 응답 shape 3 신규 필드 검증
- [x] LoginService 변경의 회귀 0 — deleted 가 아닌 정상 사용자는 기존과 동일 동작

## 후속 작업

- FE follow-up — `frontend/src/lib/mock/mypage.ts` 의 `ACCOUNT_MOCK`/`NOTI_SETTINGS_MOCK` 을 실 API 호출로 교체 (별도 작은 PR)
- spec: `docs/superpowers/specs/2026-05-27-feat-mypage-be-pr-a-design.md`
- plan: `docs/superpowers/plans/2026-05-27-feat-mypage-be-pr-a.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL 출력. CI 통과 후 리뷰.

- [ ] **Step 5: 사용자에게 PR URL 보고**

PR URL 을 보고하고 이번 plan 완료. PR B (noti-center) 는 별도 spec/plan cycle.

---

## 완료 조건 (Done definition)

- 7 task 모두 commit · push 완료 (Task 8 은 검증/PR 만)
- PR 이 develop 기준으로 생성 + CI 통과
- 신규 통합 테스트 4 파일 + 갱신된 MeIntegrationTest 통과
- 기존 모든 테스트 회귀 0 (특히 LoginIntegrationTest, RefreshIntegrationTest)
- V4 마이그레이션이 dev/test DB 양쪽에서 성공
