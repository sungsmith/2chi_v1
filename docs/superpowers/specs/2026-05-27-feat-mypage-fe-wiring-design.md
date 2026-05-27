# mypage FE wiring — `feat/mypage-fe-wiring` Spec

**브랜치 베이스**: `develop` (`df8fcc9` 시점, PR #25 머지 직후)
**상위 spec**:
- [`docs/superpowers/specs/2026-05-26-feat-mypage-cluster-design.md`](2026-05-26-feat-mypage-cluster-design.md) — FE PR #23 (UI mock-only)
- [`docs/superpowers/specs/2026-05-27-feat-mypage-be-pr-a-design.md`](2026-05-27-feat-mypage-be-pr-a-design.md) — BE PR #25 (실 endpoint 3개)
**작성일**: 2026-05-27

---

## 1. 목적

FE PR #23 에서 UI mock-only 로 머지된 mypage cluster 의 mock 데이터를 BE PR #25 의 실 API 호출로 교체. account / noti-settings / withdraw 3 endpoint 만 wiring — social / noti-center 는 v2 OAuth / PR B 까지 mock 유지.

**완료 후 사용자가 실제로 할 수 있는 일**:
- 닉네임 변경 (실제 DB 반영)
- 비밀번호 변경 (실제 hash 갱신, 자동 재로그인 유도)
- 회원 탈퇴 (실제 deleted_at 세팅, 자동 로그아웃)
- 알림 설정 토글 (실제 sparse override 저장, locked 항목 차단)

---

## 2. 현 상태 진단

### 2.1 FE 현재 mypage (PR #23 머지 상태)

| 컴포넌트 | 데이터 출처 | 인터랙션 |
|---|---|---|
| `AccountView` | `ACCOUNT_MOCK` (mock) | 모든 버튼 `disabled` |
| `NotiSettingsView` | `NOTI_SETTINGS_MOCK` (mock) | 토글 시각적 표현만, callback 없음 |
| `SocialView` | `SOCIAL_MOCK` (mock) | 모든 버튼 `disabled` — **이번 PR 무변경** |
| `NotiCenterView` | `NOTI_CENTER_MOCK` (mock) | static — **이번 PR 무변경** |
| `DangerView` | (인풋 없음) | 모든 버튼 `disabled` |

### 2.2 BE PR #25 의 endpoint

- `GET /api/v1/users/me` (확장된 shape: userId/email/nickname/role/onboardingCompleted/joinedAt/passwordChangedAt/plan)
- `PATCH /api/v1/users/me` — nickname
- `PATCH /api/v1/users/me/password` — currentPassword + newPassword
- `DELETE /api/v1/users/me` — currentPassword
- `GET /api/v1/users/me/noti-settings` — 12개 정의 + 머지된 enabled
- `PATCH /api/v1/users/me/noti-settings` — overrides 배열

### 2.3 FE API client 패턴

- `lib/api/http.ts` — `http()` wrapper (token + auto-refresh)
- `lib/api/{domain}.ts` 모듈별 함수 export
- Client component + `useEffect` + `useState` (career-content.tsx 참조 패턴)
- **SWR / TanStack Query 없음** — manual state
- `useAuth()` 훅이 `{user, login, logout, setUser, ...}` 제공
- toast 시스템 없음 — inline error state

### 2.4 결정

| # | 결정 | 사유 |
|---|---|---|
| 1 | 닉네임/비밀번호 변경 — Modal 패턴 | 기존 `portfolio-modal` / `event-create-modal` 와 일관. 유효성 검증 + 에러 표시 + cancel/submit 명확 |
| 2 | noti-settings 토글 — Optimistic update + revert on error | 12개 항목 빠른 연속 클릭에 자연스러움. BE 가 single-item PATCH 도 지원 |
| 3 | 탈퇴 성공 — `setAccessToken(null) + setUser(null) + router.push("/login?withdrawn=true")` | 로그인 페이지에서 "30일 내 복구" 안내 banner 표시 |
| 4 | 비밀번호 변경 성공 — forced logout + `router.push("/login?password-changed=true")` | BE PR #25 known limitation 해소 (옛 token ~15분 유효). 안전 default |
| 5 | feedback — inline error in modal + banner on login page | toast 시스템 도입은 별도 v2 issue. 현 표면 limited 라 inline 으로 충분 |
| 6 | 데이터 sync — per-view fetch + selective AuthContext sync | career-content 등 기존 패턴 일관. AuthContext 큰 변경 회피 |
| 7 | AuthContext 에 `refreshUser()` 추가 | 닉네임 변경 후 TopNav/ProfileMenu 갱신용. setUser() 직접 호출보다 캡슐화 |
| 8 | social / noti-center — **이번 PR 무변경** (mock 유지) | v2 OAuth / PR B 작업으로 분리. `SOCIAL_MOCK` / `NOTI_CENTER_MOCK` 보존 |

---

## 3. Architecture & 변경 파일

### 3.1 신규 (API + types)

| 파일 | 책임 |
|---|---|
| `frontend/src/lib/types/mypage.ts` | `MeProfile` / `NotiSettingItemDto` / `NotiSettingsResponse` / `UpdateNotiOverride` 타입 |
| `frontend/src/lib/api/mypage.ts` | 6 함수: `fetchMe` / `updateNickname` / `changePassword` / `withdraw` / `fetchNotiSettings` / `updateNotiSettings`. ErrorCode → 한국어 메시지 매핑 |

### 3.2 신규 (modal components)

| 파일 | 책임 |
|---|---|
| `frontend/src/components/mypage/nickname-edit-modal.tsx` | 단일 input + 클라이언트 측 pattern 검증 + PATCH /me |
| `frontend/src/components/mypage/password-change-modal.tsx` | 3 input (current/new/confirm) + PATCH /me/password + 성공 시 forced logout |
| `frontend/src/components/mypage/withdraw-confirm-modal.tsx` | currentPassword input + DELETE /me + 성공 시 forced logout + redirect |

### 3.3 신규 (utility)

| 파일 | 책임 |
|---|---|
| `frontend/src/lib/utils/relative-time.ts` | `formatRelativeKo(date)` — "3개월 전" / "어제" / "방금 전" 등 한국어 상대 시각 |

### 3.4 Modify (views + pages)

| 파일 | 변경 |
|---|---|
| `frontend/src/components/mypage/account-view.tsx` | props 제거 → 내부 `fetchMe` + modal trigger 상태. `passwordChangedAt === joinedAt` 분기 표시 |
| `frontend/src/components/mypage/noti-settings-view.tsx` | props 제거 → 내부 `fetchNotiSettings` + optimistic toggle handler |
| `frontend/src/components/mypage/noti-settings-row.tsx` | `defOn`/`locked` props → `item: NotiSettingItemDto` + `onToggle(next: boolean)` callback. switch 가 interactive button |
| `frontend/src/components/mypage/danger-view.tsx` | "회원 탈퇴" 버튼 활성 + modal trigger. "데이터 내보내기" 는 disabled 유지 (v2) |
| `frontend/src/app/(app)/mypage/page.tsx` | `<AccountView />` (props 제거) |
| `frontend/src/app/(app)/mypage/notifications/page.tsx` | `<NotiSettingsView />` (props 제거) |
| `frontend/src/contexts/auth-context.tsx` | `refreshUser()` 메서드 추가: `fetchMe()` 호출 → AuthUser 필드만 매핑 → setUser() |
| `frontend/src/app/(public)/login/page.tsx` | `?withdrawn=true` / `?password-changed=true` 쿼리 감지 → 상단 banner. 복구 기능은 v2 |
| `frontend/src/lib/mock/mypage.ts` | `ACCOUNT_MOCK` + `NOTI_SETTINGS_MOCK` 제거. `SOCIAL_MOCK` + `NOTI_CENTER_MOCK` 유지 (v2/PR B) |

### 3.5 Modify (tests)

| 파일 | 변경 |
|---|---|
| `frontend/src/components/mypage/__tests__/account-view.test.tsx` | mock prop 제거 + fetchMe mocking |
| `frontend/src/components/mypage/__tests__/noti-settings-view.test.tsx` | mock prop 제거 + fetchNotiSettings mocking + toggle 인터랙션 테스트 |

### 3.6 신규 (tests)

| 파일 | 책임 |
|---|---|
| `frontend/src/components/mypage/__tests__/nickname-edit-modal.test.tsx` | 정상 / 형식 위반 / 중복 / 취소 |
| `frontend/src/components/mypage/__tests__/password-change-modal.test.tsx` | 정상 / current 틀림 / new 불일치 / unchanged |
| `frontend/src/components/mypage/__tests__/withdraw-confirm-modal.test.tsx` | 정상 → forced logout 검증 / password 틀림 |
| `frontend/src/lib/utils/__tests__/relative-time.test.ts` | "방금 전" / "5분 전" / "3개월 전" / "1년 전" |

**총 변경 ~16 파일** (신규 8 + 수정 8)

---

## 4. Type Contracts

### 4.1 `lib/types/mypage.ts`

```typescript
export type MeProfile = {
  userId: number;
  email: string;
  nickname: string;
  role: string;
  onboardingCompleted: boolean;
  joinedAt: string;            // ISO 8601
  passwordChangedAt: string;   // ISO 8601 (backfill 됐으므로 항상 값 있음)
  plan: "free" | "pro";        // v1 = "free" 만
};

export type NotiSettingItemDto = {
  id: string;
  category: string;
  label: string;
  description: string;
  enabled: boolean;            // BE 가 머지한 effective state
  locked: boolean;
};

export type NotiSettingsResponse = {
  settings: NotiSettingItemDto[];
};

export type UpdateNotiOverride = {
  id: string;
  enabled: boolean;
};
```

### 4.2 ErrorCode → 한국어 메시지 매핑 (`lib/api/mypage.ts`)

각 함수가 응답 body 의 `code` 필드를 확인:

| BE ErrorCode | FE 메시지 |
|---|---|
| `NICKNAME_DUPLICATE` | "이미 사용중인 닉네임이에요." |
| `PASSWORD_MISMATCH` | "현재 비밀번호가 일치하지 않아요." |
| `PASSWORD_UNCHANGED` | "현재 비밀번호와 동일해요. 다른 비밀번호로 설정해주세요." |
| `ALREADY_WITHDRAWN` | "이미 탈퇴 처리됐어요." |
| `SETTING_LOCKED` | "보안 알림은 변경할 수 없어요." |
| `UNKNOWN_SETTING` | "알 수 없는 알림 설정이에요." |
| `DUPLICATE_SETTING` | "같은 항목이 중복돼서 전송됐어요." |
| (기타 4xx/5xx) | "{기능}에 실패했어요." |

---

## 5. View 변경 상세

### 5.1 AccountView

- 내부 state: `me: MeProfile | null`, `error`, `editingNickname`, `changingPassword`
- mount 시 `fetchMe` → setMe. 실패 시 inline error
- 닉네임 row: 활성화된 "편집" 버튼 → `<NicknameEditModal>`
- 비밀번호 row: 활성화된 "비밀번호 변경" 버튼 → `<PasswordChangeModal>`
- 비밀번호 hint:
  - `passwordChangedAt === joinedAt` → "가입 후 변경하지 않았어요 · 90일마다 변경을 권장해요"
  - 그 외 → `마지막 변경 {formatRelativeKo(passwordChangedAt)} · 90일마다 변경을 권장해요`
- 이메일 변경 버튼 / 2FA 행 — **disabled 유지** (v2)
- 닉네임 변경 성공 시:
  ```ts
  setMe(updated);
  await refreshUser();  // TopNav/ProfileMenu 동기화
  setEditingNickname(false);
  ```

### 5.2 NotiSettingsView

- 내부 state: `items: NotiSettingItemDto[] | null`, `error`
- mount 시 `fetchNotiSettings` → setItems
- `handleToggle(id, nextEnabled)`:
  1. `const previous = items`
  2. setItems with optimistic update
  3. await `updateNotiSettings([{id, enabled: nextEnabled}])`
  4. 성공: setItems(response.settings) (BE 가 머지한 최신 sync)
  5. 실패: setItems(previous) + error message + 3초 후 dismiss
- `NotiSettingsRow` — switch 가 button 이 되어 클릭/space/enter 으로 toggle
- locked 항목 — switch 대신 "강제 ON" pill 유지 (기존 mock 패턴)

### 5.3 DangerView

- "데이터 내보내기" 버튼 — disabled 유지 (v2)
- "회원 탈퇴" 버튼 — 활성화 + `<WithdrawConfirmModal>` trigger

### 5.4 NicknameEditModal

- 단일 input + 클라이언트 측 pattern 검증 (`^[가-힣A-Za-z0-9_-]{2,20}$`, signup 과 동일)
- "현재 닉네임과 같음" → 그냥 modal close (no-op)
- error 상태: inline message
- 성공 → `onSuccess(updated: MeProfile)` 콜백

### 5.5 PasswordChangeModal

- 3 input: `currentPassword`, `newPassword`, `confirmNewPassword`
- 클라이언트 측 검증: `newPassword === confirmNewPassword`, `newPassword.length > 0` (BE 가 NotBlank 만 검증하므로 같이 가벼움)
- 성공 시:
  ```ts
  setAccessToken(null);
  setUser(null);
  router.push("/login?password-changed=true");
  ```
- error: inline (`PASSWORD_MISMATCH` / `PASSWORD_UNCHANGED` 등)

### 5.6 WithdrawConfirmModal

- "탈퇴 시 영구 삭제되는 데이터" 안내 박스 (기존 DangerView 문구 그대로)
- 단일 input: `currentPassword`
- 성공 시:
  ```ts
  setAccessToken(null);
  setUser(null);
  router.push("/login?withdrawn=true");
  ```

### 5.7 login page banner

`useSearchParams()` 로 쿼리 감지:
- `?withdrawn=true` → "탈퇴 처리됐어요. 30일 이내에 같은 이메일로 로그인하면 복구할 수 있어요." (복구 기능은 v2 — 메시지는 약속만)
- `?password-changed=true` → "비밀번호가 변경됐어요. 다시 로그인해주세요."

dismissable banner (close 버튼). banner 닫기 시 query 제거 (`router.replace("/login")`).

### 5.8 AuthContext refreshUser

```typescript
async function refreshUser(): Promise<void> {
  try {
    const me = await fetchMe();
    setUser({
      userId: me.userId,
      email: me.email,
      nickname: me.nickname,
      onboardingCompleted: me.onboardingCompleted,
    });
  } catch {
    // silent fail — caller 의 onSuccess 가 이미 본인 state 업데이트
  }
}
```

`AuthContext` value 에 `refreshUser` 추가. 닉네임 변경 후 호출.

---

## 6. 테스트

### 6.1 단위 + 컴포넌트 테스트 (vitest + RTL)

- `relative-time.test.ts` — "방금 전" / "5분 전" / "어제" / "3개월 전" / "1년 전" boundary 케이스
- `nickname-edit-modal.test.tsx` — 정상 변경 / pattern 위반 / 동일 닉네임 (no-op close) / API 실패 메시지 / 취소
- `password-change-modal.test.tsx` — 정상 (forced logout 검증) / 현재 비번 틀림 / new ≠ confirm / blank
- `withdraw-confirm-modal.test.tsx` — 정상 (forced logout + redirect 검증) / 비번 틀림 / 이미 탈퇴
- 기존 `account-view.test.tsx` 갱신 — fetchMe mock + modal trigger button visible / loading / error
- 기존 `noti-settings-view.test.tsx` 갱신 — fetchNotiSettings mock + toggle 인터랙션 + optimistic + revert 검증

### 6.2 회귀

- 기존 모든 FE 테스트 통과 (특히 AccountView/NotiSettingsView 의 mock-driven 테스트가 fetch 기반으로 전환)
- `npm run lint` / `npm run test` / `npm run build` 통과

### 6.3 수동 sanity check

dev server (`npm run dev` + backend `./gradlew bootRun`) 실행:
1. 로그인 → /mypage 진입 → 신규 필드 (`passwordChangedAt`, `joinedAt`) 표시 확인
2. 닉네임 변경 → TopNav 의 닉네임도 즉시 갱신 확인
3. 비밀번호 변경 → 자동 logout + login 페이지 banner 확인 → 새 비밀번호로 로그인
4. /mypage/notifications → 토글 클릭 → 즉시 시각 반영 → 새로고침 후 유지 확인
5. /mypage/notifications → locked 항목 클릭 시도 → 변경 안 됨 확인
6. /mypage/withdraw → 탈퇴 → /login redirect + banner 확인 → 같은 이메일 재로그인 시도 → 410 USER_WITHDRAWN_GRACE 응답 확인 (FE 가 적절히 메시지 표시 — 이번 PR 의 추가 작업 일부)

### 6.4 BE 측 통합 회귀

PR #25 의 통합 테스트와 같이 — BE 변경 없으므로 FE 만 검증.

---

## 7. 리스크 · Rollback

### 7.1 리스크

| 리스크 | 완화 |
|---|---|
| `useAuth().setUser(null)` 호출 시 race condition — 즉시 다음 fetch 가 stale token 사용 가능 | `setAccessToken(null)` 을 setUser 보다 먼저 호출. router.push 가 navigation 트리거 |
| Optimistic toggle 의 revert UX 가 사용자 혼란 | error message 명확히 (3초 자동 dismiss). locked 항목은 처음부터 button disabled |
| `refreshUser()` 실패 시 (네트워크 등) 닉네임이 stale | silent fail + 다음 mount 시 fetchMe 가 갱신. 사용자 명시적 새로고침으로도 회복 |
| login page banner 가 stale query (사용자가 직접 URL 만진 경우) 표시 | dismissable. 의미 없는 정보지만 한 번 닫으면 끝 |
| Modal 의 input pattern 검증이 BE 와 불일치 | nickname pattern 은 SignupRequest 의 정규식 그대로 복사. lock-step 관리. v1 비밀번호 정책은 `@NotBlank` 만 — FE 도 같은 룰 |
| 탈퇴 직후 같은 토큰으로 background fetch 시 401 | `http()` wrapper 의 auto-refresh 가 410 USER_WITHDRAWN_GRACE 받으면 무한 루프 위험. 별도 handling 추가 — refresh 응답이 410 이면 setUser(null) 후 redirect |

### 7.2 Rollback

- FE only PR → revert 단순 (BE 변경 없음)
- noti-settings 토글이 문제 → optimistic 제거하고 await 패턴으로 일시 변경 가능

---

## 8. Out of Scope

| 항목 | 이동 |
|---|---|
| Social 4 provider 연결 wiring | v2 OAuth issue |
| Notification center entries 표시 | PR B (BE noti-center API 가 아직 없음) |
| 이메일 변경 wiring | v2 (BE endpoint 자체가 v2) |
| 2FA | v2 (BE 미구현) |
| 데이터 내보내기 | v2 (BE 미구현) |
| Toast 시스템 도입 | v2 (별도 PR) |
| Restore-on-login (탈퇴 후 30일 내 복구) | v2 (BE 측 cron + restore endpoint 와 함께) |
| 410 USER_WITHDRAWN_GRACE 응답을 받았을 때 FE 의 명시적 처리 | 이 PR 의 작은 추가 — `http()` wrapper 에 410 분기 + 토스트 대신 alert |

---

## 9. 의존성 · 후속

- 이 PR 머지 후 mypage 의 3 endpoint 가 실 데이터로 동작
- PR B (noti-center) 머지 시 `<NotiCenterView>` 가 같은 패턴으로 wiring 됨 (이번 PR 의 `NotiSettingsView` 패턴 재사용 가능)
- v2 OAuth 머지 시 `<SocialView>` wiring + `?email-changed=true` 같은 추가 banner 패턴 확장

---

## 10. Next Step

spec 통과 → `superpowers:writing-plans` 로 task-by-task 구현 plan 작성.
