# Mypage BE — PR A (`feat/mypage-be-pr-a`) Spec

**브랜치 베이스**: `develop` (`b6a3ce0` 시점, mypage FE PR #23 이 머지된 후)
**상위 spec**: [`docs/superpowers/specs/2026-05-26-feat-mypage-cluster-design.md`](2026-05-26-feat-mypage-cluster-design.md) — FE PR #23 가 명시한 "BE 5 endpoint 는 별도 issue" 의 BE 측 작업
**작성일**: 2026-05-27

---

## 1. 목적

FE PR #23 (`feat/mypage-cluster`) 이 UI mock-only 로 머지된 상태. 그 mock 을 실 API 응답으로 교체하기 위한 BE 작업.

**5 endpoint 중 3 endpoint 만 PR A 에서 구현**:
- account (R/W) — 닉네임 변경 + 비밀번호 변경
- noti-settings (R/W) — 12개 알림 정의의 per-user override
- withdraw (DELETE) — soft delete + 로그인 차단

**나머지 2 endpoint 는 별도 issue**:
- noti-center → **PR B** (notification 테이블 + 도메인 cross-cutting producer wiring — 별도 brainstorm cycle)
- social (4 provider 연결) → **v2 OAuth issue** (실 OAuth 도입 시 같이)

---

## 2. 현 상태 진단

### 2.1 기존 BE 구조 (`com.twochi.user`)

| 파일 | 책임 |
|---|---|
| `controller/UserController.java` | `GET /api/v1/users/me` 1개만 존재 |
| `service/UserQueryService.java` | me snapshot 빌드 |
| `dto/MeResponse.java` | GET /me 응답 DTO |
| `domain/User.java` | `id/email/password_hash/nickname/role/email_verified/last_login_at/failed_login_count/locked_until/created_at/updated_at/deleted_at` 컬럼 — **`password_changed_at` 없음** |
| `repository/UserRepository.java` | 기본 JPA repo |

### 2.2 DB 스키마 (`V1__init_schema.sql`)
- `app_user.deleted_at` 이미 존재. 컬럼 코멘트: "탈퇴 시각. NULL이면 alive 사용자. 30일 경과 시 배치 영구 삭제" — 우리 방향과 정확히 일치
- email/nickname 의 UNIQUE INDEX 가 `WHERE deleted_at IS NULL` (partial) — 탈퇴 시 슬롯 freed
- 모든 user-owned 테이블이 `ON DELETE CASCADE` (profile/education/certificate/experience/resume/career_history/project/portfolio_link/job_posting/company_analysis/cover_letter_master) — user hard delete 시 자동 cascade

### 2.3 FE 측 기대 mock (`frontend/src/lib/mock/mypage.ts`)
- `ACCOUNT_MOCK`: email/nickname/joinedAt/plan
- `NOTI_SETTINGS_MOCK`: 12개 정의 (4 category × 평균 3개), 3개는 `locked: true`
- `SOCIAL_MOCK`/`NOTI_CENTER_MOCK` — PR A 무관 (각각 v2 OAuth / PR B 로 분리)

---

## 3. 핵심 결정

| # | 결정 | 사유 |
|---|---|---|
| 1 | PR 쪼개기 — A(account+noti-settings+withdraw) / B(noti-center) / v2(social) | 5 endpoint 의 무게가 제각각. noti-center 는 producer wiring 이 다른 도메인까지 침범해서 별도 분리 필요 |
| 2 | URL 컨벤션 `/api/v1/users/me/*` (mypage 가 아님) | 기존 `/api/v1/users/me` 와 일관. "mypage" 는 FE UI 클러스터 명. RESTful resource path 가 자연스러움 |
| 3 | withdraw 시맨틱 — `user.deleted_at` 만 세팅. owned data 미터치 | 모든 owned 테이블이 FK ON DELETE CASCADE → v2 cron 의 user hard delete 시 자동 cascade. soft 단계에서 owned table 손댈 일 0. UI mock 의 "30일 유예 후 영구 삭제 / 다시 로그인하면 복구" 약속도 지킴 |
| 4 | 본인 확인 — `currentPassword` 재입력 (비밀번호 변경 / 탈퇴 둘 다) | v1 사용자 전원이 이메일+비밀번호. JWT 만으로 비가역 작업은 위험. SMTP 부재로 메일 토큰 방식은 무리 |
| 5 | 이메일 변경 endpoint 는 v2 | 새 메일 인증 인프라 필요. OAuth 도입 시 같이 묶음 |
| 6 | noti-settings 저장 — sparse `user_noti_setting` 테이블 (default 와 다른 항목만 row) | 사용자 토글이 대체로 sparse. JSONB 보다 JPA 와 자연스러움. 추후 통계/audit 에 유리. 12개 정의는 **코드 enum** (제품 스펙) |
| 7 | locked 3개(계정 보안 알림) override 시도 → 400 SETTING_LOCKED | DB 에 row 만들지 않음. enum 의 `locked` 플래그로 거부 |
| 8 | `password_changed_at` 컬럼 신규 추가 + 기존 사용자 `created_at` 으로 backfill | mock 의 "마지막 변경 90일" 표시를 위해 필요. backfill 로 기존 사용자도 의미있는 값 보장 |
| 9 | PII 익명화 + 30일 hard delete cron + 복구(restore-on-login) → v2 | PR A 폭발 방지. v1 의 첫 30일은 PII 보존되지만, PIPA "지체 없이" 는 30일까지 운영 사유 통상 인정 |
| 10 | JWT 무효화 — 탈퇴는 login + refresh 차단으로 access window 캡 (최대 ~15분), 비밀번호 변경 token revocation 은 v2 | revocation list infra 부재. `JwtAuthenticationFilter` 는 claims-only 라 매 요청 DB 조회는 비용. login/refresh 에서 deleted_at 체크하면 자연스럽게 token 만료 후 차단 |

---

## 4. Architecture & 변경 파일

### 4.1 Controllers (`com.twochi.user.controller`)

**`UserController`** — 확장
- `GET /api/v1/users/me` (기존, 응답 shape 만 확장)
- `PATCH /api/v1/users/me` — 닉네임 변경 (신규)
- `PATCH /api/v1/users/me/password` — 비밀번호 변경 (신규)
- `DELETE /api/v1/users/me` — 탈퇴 (신규)

**`NotiSettingsController`** — 신규 (`com.twochi.user.controller`)
- `GET /api/v1/users/me/noti-settings` — 12개 settings 반환
- `PATCH /api/v1/users/me/noti-settings` — overrides upsert

### 4.2 Services (`com.twochi.user.service`)

| 클래스 | 신규/기존 | 책임 |
|---|---|---|
| `UserQueryService` | 기존, no-op | me snapshot 빌드 (응답 shape 확장에 따라 필드 추가) |
| `UserProfileUpdateService` | **신규** | 닉네임 PATCH (중복 검증 + 갱신) |
| `PasswordChangeService` | **신규** | currentPassword 검증 + 해시 갱신 + `password_changed_at` 갱신 |
| `AccountClosureService` | **신규** | currentPassword 검증 + `deleted_at` 세팅 |
| `NotiSettingService` | **신규** (`com.twochi.user.service.noti`) | enum 정의 + override 머지 + locked 거부 + sparse upsert |

### 4.3 Domain

**`User.java`** — 컬럼 1개 추가
- `password_changed_at: Instant?` (nullable, backfill 됨)
- 메서드 추가: `changePassword(newHash, now)`, `withdraw(now)`
- `restore(now)` 는 v2 cron 작업에서 추가 (PR A 에서는 정의하지 않음)

**`UserNotiSetting.java`** — 신규 엔티티 (`com.twochi.user.domain`)
```java
@Entity
@Table(name = "user_noti_setting")
@IdClass(UserNotiSettingId.class)
public class UserNotiSetting {
    @Id Long userId;
    @Id String settingId;  // enum 의 key
    boolean enabled;
    Instant updatedAt;
}
```

**`NotiSettingDef.java`** — 신규 enum (`com.twochi.user.domain.noti`)
- 12개 정의 (id/category/label/description/defaultOn/locked) — FE mock `NOTI_SETTINGS_MOCK` 과 1:1 일치
- `static NotiSettingDef fromId(String id)` lookup

### 4.4 Repository

- `UserNotiSettingRepository` 신규
  - `findAllByUserId(Long userId): List<UserNotiSetting>`
  - `deleteByUserIdAndSettingId(Long userId, String settingId)`

### 4.5 DTOs (`com.twochi.user.dto`)

| DTO | shape |
|---|---|
| `MeResponse` (기존, 확장) | + `joinedAt`, `passwordChangedAt`, `plan` |
| `UpdateNicknameRequest` | `{ nickname: String }` |
| `ChangePasswordRequest` | `{ currentPassword, newPassword }` |
| `WithdrawRequest` | `{ currentPassword }` |
| `NotiSettingsResponse` | `{ settings: List<NotiSettingItem> }` |
| `NotiSettingItem` | `{ id, category, label, description, enabled, locked }` |
| `UpdateNotiSettingsRequest` | `{ overrides: List<{id, enabled}> }` |

### 4.6 Auth 변경 (`com.twochi.auth`)

- **`LoginService.login`** — `findByEmail` 로 변경(현재는 `findByEmailAndDeletedAtIsNull` 라 deleted 사용자가 INVALID_CREDENTIALS 받음) + `deleted_at != null` 체크 + grace window 분기 (410 `USER_WITHDRAWN_GRACE`)
- **`LoginService.refresh`** — refresh 시 user 의 `deleted_at` 체크. 탈퇴됐으면 새 access token 발급 거부 (410 `USER_WITHDRAWN_GRACE`). `RefreshTokenService` 는 token rotation 만 책임 — user load + deletedAt 분기는 `LoginService.refresh` 안에 위치
- **`JwtAuthenticationFilter`** — **변경 없음** (claims-only 유지). 탈퇴 직후 기존 access token 은 만료(~15분) 까지 유효. refresh 차단으로 자연스럽게 access window 캡

### 4.7 ErrorCode 추가 (`com.twochi.common.exception.ErrorCode`)

| code | HTTP | 의미 |
|---|---|---|
| `USER_WITHDRAWN` | 410 | 탈퇴된 계정 (30일 grace 경과 시 — v1 에서는 cron 미구현이라 사실상 unreachable) |
| `USER_WITHDRAWN_GRACE` | 410 | 탈퇴 후 30일 유예 중 (로그인/refresh 거부) |
| `ALREADY_WITHDRAWN` | 409 | DELETE /me 가 이미 탈퇴된 사용자에게 |
| `PASSWORD_MISMATCH` | 400 | currentPassword 불일치 |
| `PASSWORD_UNCHANGED` | 400 | newPassword == current |
| `NICKNAME_DUPLICATE` (기존 재사용) | 409 | 닉네임 중복 |
| `SETTING_LOCKED` | 400 | locked 설정 override 시도 |
| `UNKNOWN_SETTING` | 400 | 알 수 없는 setting_id |

### 4.8 Migration

**`V4__mypage_password_changed_at_and_noti_settings.sql`**
```sql
ALTER TABLE app_user ADD COLUMN password_changed_at TIMESTAMPTZ;
COMMENT ON COLUMN app_user.password_changed_at IS
  '마지막 비밀번호 변경 시각. NULL 이면 가입 후 한 번도 변경 안 함 (가입 시각이 기준)';
UPDATE app_user SET password_changed_at = created_at WHERE password_changed_at IS NULL;

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

### 4.9 변경 파일 요약 (신규 ~21 + 수정 7)

**신규**
- Controller: `NotiSettingsController.java`
- Service: `UserProfileUpdateService.java`, `PasswordChangeService.java`, `AccountClosureService.java`, `noti/NotiSettingService.java`
- Domain: `UserNotiSetting.java`, `UserNotiSettingId.java`, `noti/NotiSettingDef.java`
- Repository: `UserNotiSettingRepository.java`
- DTO 6개: `UpdateNicknameRequest`, `ChangePasswordRequest`, `WithdrawRequest`, `NotiSettingsResponse`, `NotiSettingItem`, `UpdateNotiSettingsRequest`
- 마이그레이션: `V4__mypage_password_changed_at_and_noti_settings.sql` (+ `V4_R__rollback.sql`)
- 테스트 5개: `UserProfileUpdateServiceTest`, `PasswordChangeServiceTest`, `AccountClosureServiceTest`, `NotiSettingServiceTest`, `NotiSettingsControllerIntegrationTest` (+ 기존 `UserControllerIntegrationTest` 에 시나리오 추가)

**수정**
- `controller/UserController.java` (3 method 추가)
- `service/UserQueryService.java` (응답 shape 확장)
- `dto/MeResponse.java` (3 필드 추가)
- `domain/User.java` (컬럼 + 메서드 추가)
- `auth/service/LoginService.java` (deleted_at 분기 — `findByEmailAndDeletedAtIsNull` → `findByEmail` 변경 포함)
- (`auth/service/RefreshTokenService.java` 는 변경 없음 — user load 는 LoginService.refresh 에 있음)
- `common/exception/ErrorCode.java` (8 code 추가)

---

## 5. API 상세

### 5.1 GET /api/v1/users/me (응답 확장)

기존 shape: `{ userId, email, nickname, role, onboardingCompleted }`. 다음 3 필드 추가:

```json
{
  "userId": 1,
  "email": "somi@example.com",
  "nickname": "김소미",
  "role": "USER",
  "onboardingCompleted": true,
  "joinedAt": "2026-04-08T05:30:00Z",
  "passwordChangedAt": "2026-02-26T05:30:00Z",
  "plan": "free"
}
```
- `plan` 은 v1 에서 항상 `"free"` (billing 미구현, hardcode). v2 billing 도입 시 실제 컬럼 추가
- `passwordChangedAt` 이 `joinedAt` 과 같으면 FE 는 "한 번도 변경하지 않음" 으로 표시 (backfill 의미 반영)

### 5.2 PATCH /api/v1/users/me

**Request**: `{ "nickname": "새닉네임" }`

**Validation**:
- 길이 2~20
- 한글/영문/숫자/언더스코어 (회원가입 규칙 재사용)
- 본인 현재 닉네임이면 no-op (200, 변경 없음)

**Errors**:
- 400 (validation)
- 409 `NICKNAME_DUPLICATE` (기존 코드 재사용)

**Response**: 200 + 갱신된 me snapshot

### 5.3 PATCH /api/v1/users/me/password

**Request**:
```json
{ "currentPassword": "old", "newPassword": "new" }
```

**Validation**:
- currentPassword 일치 → 아니면 400 `PASSWORD_MISMATCH`
- newPassword 정책: 회원가입과 동일 (8자 이상 + 영문+숫자)
- newPassword == current → 400 `PASSWORD_UNCHANGED`

**Side effect**:
- `password_hash` 갱신
- `password_changed_at = now()`
- **JWT 무효화 안 함** (known limitation, v2)

**Response**: 204 No Content

### 5.4 DELETE /api/v1/users/me

**Request**: `{ "currentPassword": "pw" }`

**Validation**:
- currentPassword 일치 → 아니면 400 `PASSWORD_MISMATCH`
- 이미 `deleted_at != null` → 409 `ALREADY_WITHDRAWN`

**Side effect**:
- `user.deleted_at = now()` 만 세팅
- owned data 미터치
- 같은 access token 으로 이후 요청은 token 만료(~15분) 까지 가능. refresh 차단으로 access window 자연 캡 (`JwtAuthenticationFilter` claims-only 유지 — §6.1 참조). 두 번째 DELETE /me 는 `ALREADY_WITHDRAWN` 409. 다른 endpoint (PATCH /me 등) 는 v1 에서 deletedAt 체크 없음 — known limitation

**Response**: 204 No Content

### 5.5 GET /api/v1/users/me/noti-settings

**Response**:
```json
{
  "settings": [
    {"id": "deadline-d3", "category": "전형 일정 · 마감", "label": "채용공고 마감 D-3", "description": "마감 3일 전 09:00에 받기", "enabled": true, "locked": false},
    ...
    {"id": "signup-verify", "category": "계정 보안", "label": "회원가입 인증", "description": "...", "enabled": true, "locked": true}
  ]
}
```
- 12개 모두 반환 (locked 포함)
- `enabled` = DB override 있으면 override 값, 없으면 enum 의 `defaultOn`
- locked 항목은 항상 enum 의 defaultOn 그대로 (DB row 가 있을 수 없음 — PATCH 가 거부)

### 5.6 PATCH /api/v1/users/me/noti-settings

**Request**:
```json
{
  "overrides": [
    {"id": "deadline-d3", "enabled": false},
    {"id": "weekly-summary", "enabled": true}
  ]
}
```

**Validation**:
- 알 수 없는 id → 400 `UNKNOWN_SETTING`
- locked 항목 포함 → 400 `SETTING_LOCKED`

**Side effect (per item)**:
- `enabled == enum.defaultOn` → row 삭제 (default 와 같으면 sparse 유지 위해 row 제거)
- `enabled != enum.defaultOn` → row insert/update

**Response**: 200 + 갱신된 전체 settings 목록 (GET 과 동일 shape)

---

## 6. Login Block 메커니즘

### 6.1 보호 endpoint 접근 (변경 없음)

`JwtAuthenticationFilter` 는 **claims-only 유지**. 탈퇴 직후 기존 access token 은 만료(~15분) 까지 유효. 매 요청 DB 조회 비용을 피하기 위한 의도적 선택. 자연스러운 invalidate 는 token 만료 + refresh 차단 조합으로 달성 (§6.3).

### 6.2 로그인 시도 (`LoginService.login`)

기존 `findByEmailAndDeletedAtIsNull` 를 `findByEmail` 로 변경 후 명시적 분기:

```java
User user = userRepository.findByEmail(req.email())
    .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

if (user.getDeletedAt() != null) {
    Instant graceUntil = user.getDeletedAt().plus(Duration.ofDays(30));
    if (Instant.now().isBefore(graceUntil)) {
        // 410 GONE — 30일 유예 내. 복구 path 는 v2
        throw new BusinessException(ErrorCode.USER_WITHDRAWN_GRACE);
    }
    // 30일 경과 — hard delete cron 이 v2 이므로 PR A 에서는 발생 불가 (방어적)
    throw new BusinessException(ErrorCode.USER_WITHDRAWN);
}
// 정상 로그인 진행 (기존 로직)
```

`graceUntil` 응답 body 노출은 `BusinessException` 의 detail/message 패턴 따라 — 기존 코드의 detail 전달 메커니즘에 맞춰 plan 에서 구현.

### 6.3 Refresh 시도 (`LoginService.refresh`)

refresh 시 user 의 `deleted_at` 체크. 탈퇴됐으면 새 access token 발급 거부:

```java
User user = userRepository.findById(userId)
    .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));

if (user.getDeletedAt() != null) {
    throw new BusinessException(ErrorCode.USER_WITHDRAWN_GRACE);
}
// 정상 refresh 진행
```

이 조합으로 탈퇴 사용자 access window 자동 캡: **token TTL ≤ 15분**.

복구 (restore) endpoint 는 PR A 스코프 외 — v2 의 30일 cron 작업에 같이.

복구(restore) endpoint 는 PR A 스코프 외 — v2 의 30일 cron 작업에 같이.

---

## 7. 테스트 · 검증 정책

### 7.1 Unit tests (`backend/src/test/java/com/twochi/user`)

| 테스트 | 케이스 |
|---|---|
| `UserProfileUpdateServiceTest` | 정상 변경 · 중복 닉네임(NICKNAME_DUPLICATE) · 본인 현재 닉네임 no-op · validation |
| `PasswordChangeServiceTest` | 정상 · currentPassword 틀림(PASSWORD_MISMATCH) · same as current(PASSWORD_UNCHANGED) · 약한 비밀번호 |
| `AccountClosureServiceTest` | 정상(deleted_at 세팅 + owned data 그대로) · currentPassword 틀림 · already withdrawn |
| `NotiSettingServiceTest` | 빈 override → 12 default · 일부 override 머지 · default 와 같은 값 → row 미생성 · default 로 되돌리기 → row 삭제 · locked 거부 · unknown id |

### 7.2 Integration tests (Testcontainers, 기존 패턴)

| 테스트 | 케이스 |
|---|---|
| `AccountClosureIntegrationTest` 등 | PATCH /me · PATCH /me/password · DELETE /me end-to-end. 탈퇴 후 같은 token 으로 두 번째 DELETE → 409 ALREADY_WITHDRAWN. 탈퇴 후 POST /auth/login → 410 USER_WITHDRAWN_GRACE. 탈퇴 후 POST /auth/refresh → 410 USER_WITHDRAWN_GRACE |
| `NotiSettingsControllerIntegrationTest` | GET (override 없음) → 12 default · PATCH 후 GET 반영 · locked 시도 400 |

### 7.3 회귀

- 기존 `/users/me` GET 테스트가 strict shape 검증하면 같은 PR 안에서 갱신 (`passwordChangedAt`/`joinedAt`/`plan` 추가). 정당화는 PR description.
- `AuthServiceLoginTest` 에 deleted user 분기 케이스 추가.

### 7.4 자동 (CI 필수)

- `./gradlew build` — 컴파일 + 테스트 통과
- `./gradlew test` 전체 통과 (회귀 0)

---

## 8. 리스크 · Rollback

### 8.1 리스크

| 리스크 | 완화 |
|---|---|
| `password_changed_at` backfill 시 `created_at` 사용 → "마지막 변경" 이 가입 시점. FE 가 "3개월 전" 같은 텍스트 표시 시 부정확 | PR description 에 backfill 의미 명시. FE 는 `passwordChangedAt == createdAt` 이면 "한 번도 변경하지 않음" 표시 |
| 기존 GET /me 응답 shape 변경 (필드 3개 추가) | 외부 consumer 없음 (FE 단일). 기존 strict 테스트는 같은 PR 에서 갱신 |
| JWT 무효화: 비밀번호 변경 후 옛 토큰 만료 전까지 유효. 탈퇴 후 옛 토큰도 ~15분간 유효 (refresh 차단으로 cap) | v1 known limitation. FE 가 비밀번호 변경 / 탈퇴 직후 자체 로그아웃 + 재로그인/리다이렉트 유도. PR description 에 명시 |
| `user_noti_setting.setting_id` VARCHAR 가 enum 키와 어긋날 위험 (enum 이름 변경 시) | 단위 테스트로 모든 enum 키가 DB write/read 사이클 통과 검증. 키 변경 시 마이그레이션 필수 (룰 명시) |
| 첫 30일 PII 보존 (v2 cron 미구현 상태) | PIPA "지체 없이" 의 30일 운영 사유 통상 인정. v2 cron 작업 이슈에 backref |

### 8.2 Rollback

- PR A 단독 머지 후 회귀 발견 → revert. V4 마이그레이션은 down 스크립트(`V4_R__rollback.sql`) 같이 PR 에 포함, Flyway repair 절차 따름
- noti-settings 부분만 문제 → NotiSettingsController disable (`@ConditionalOnProperty` 등) — 필요 시점에 결정

---

## 9. Out of Scope (PR A)

| 항목 | 이동 위치 |
|---|---|
| social 연결 (4 provider) | **v2 OAuth issue** (실 OAuth 도입 시) |
| noti-center (알림 센터 entries + 도메인 producer wiring) | **PR B** (별도 brainstorm cycle) |
| 이메일 변경 endpoint | v2 (메일 인증 인프라 같이) |
| 30일 cron — PII 익명화 + hard delete | v2 (별도 batch job issue) |
| 복구 (restore-on-login within 30 days) | v2 (cron 작업과 같이) |
| JWT 즉시 token revocation (비밀번호 변경 시) | v2 (revocation list infra) — PR description known limitation. PR A 에선 탈퇴만 refresh 차단으로 cap |
| 2FA | v2 (mock "곧 출시" 표시) |
| 데이터 내보내기 (JSON+PDF) | v2 (mock disabled button) |

---

## 10. 의존성 · 후속

- **PR A 머지 후 FE 측 follow-up** — `frontend/src/lib/mock/mypage.ts` 의 `ACCOUNT_MOCK`/`NOTI_SETTINGS_MOCK` 을 실 API 호출(SWR or fetch)로 교체. 별도 작은 PR
- **PR B (noti-center)** — PR A 의 ErrorCode 패턴 / `com.twochi.user` 패키지 컨벤션 재사용
- **v2 cron** — `user.deleted_at < now - 30d` 인 사용자에 대해 PII 익명화 + hard delete. owned data 는 FK CASCADE 로 자동 정리

---

## 11. Next Step

spec 통과 → `superpowers:writing-plans` skill 로 task-by-task 구현 plan 작성.
