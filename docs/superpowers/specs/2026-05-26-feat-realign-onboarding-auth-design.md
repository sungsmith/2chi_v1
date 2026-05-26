# 2단계 PR 8번 (`feat/realign-onboarding-auth`) Spec

**브랜치 베이스**: `develop` (#23 머지됨, commit `518d760`)
**상위 spec**: [`docs/superpowers/specs/2026-05-25-design-system-realign-design.md`](2026-05-25-design-system-realign-design.md) (§5 표의 onboarding + auth 항목)
**작성일**: 2026-05-26
**비고**: 2단계의 **마지막 PR** — 완료 시 design_system 정렬 100% 완성

---

## 1. 목적

`/onboarding` (4-step) + `/login` + `/signup` 화면을 mock 과 픽셀 단위로 재정렬. mock 의 `/reset-password` + `/verify-email` 2 신규 라우트 추가 (UI mock-only — BE 부재).

mock:
- `screen-onboarding.jsx` (241줄, onboarding 4-step)
- `screen-account.jsx` 의 auth 파트 (line 24-305 — ResetPasswordView / VerifyEmailView / AuthView)

---

## 2. 현 상태 진단

### 2.1 frontend 현재
- `(public)/onboarding/page.tsx` + `onboarding.css` + 컴포넌트 7개 (brand-panel · icons · onboarding-flow · step-purpose/career/positions/recap · stepper · welcome-modal)
- `(public)/login/page.tsx` + `login-form.tsx`
- `(public)/signup/page.tsx` + `signup-form.tsx` + `consent-section.tsx`
- `(public)/privacy/page.tsx` + `(public)/terms/page.tsx` (정적 약관)
- `(public)/error.tsx` + `(public)/not-found.tsx` (error pages PR #22 에서 추가)
- **`/reset-password`, `/verify-email` 미구현**

### 2.2 mock

| view | mock 파일 | line | 비고 |
|---|---|---|---|
| onboarding 4-step | `screen-onboarding.jsx` | 1-241 | Stepper + 4 step + welcome modal |
| ResetPasswordView | `screen-account.jsx` | 24-113 | 비밀번호 재설정 (이메일 입력 → 코드 입력 → 새 비밀번호) |
| VerifyEmailView | `screen-account.jsx` | 114-147 | 이메일 인증 대기 화면 |
| AuthView (login + signup) | `screen-account.jsx` | 170-305 | mode prop 로 분기 |

### 2.3 핵심 결정

| # | 결정 | 사유 |
|---|---|---|
| 1 | onboarding 7 컴포넌트 마크업 mock 정렬 + onboarding.css 삭제 | dashboard/career.css 패턴 — kit.css 로 통합 |
| 2 | login-form / signup-form 마크업 mock AuthView 정렬 | mock 의 통일된 .auth-shell 패턴 |
| 3 | `/reset-password` + `/verify-email` 신규 라우트 | mock 에 화면 있음. BE 부재 → UI mock-only |
| 4 | mock auth 의 brand-panel 패턴 → 기존 frontend brand-panel.tsx 재활용 | 이미 있음. 마크업만 정합 |
| 5 | reset-password 의 3-step (이메일 → 코드 → 새 비밀번호) state machine 그대로 mock 따름 | mock 의 state 그대로 |
| 6 | BE 부재 → form submit 은 noop (성공 화면으로 단순 전환) | UI mock-only |

---

## 3. 변경 파일 (~25)

### 신규

| 파일 | 책임 |
|---|---|
| `frontend/src/app/(public)/reset-password/page.tsx` | 비밀번호 재설정 라우트 |
| `frontend/src/app/(public)/verify-email/page.tsx` | 이메일 인증 대기 라우트 |
| `frontend/src/components/auth/reset-password-form.tsx` | mock ResetPasswordView (3-step) |
| `frontend/src/components/auth/verify-email-view.tsx` | mock VerifyEmailView |
| `frontend/src/components/auth/__tests__/reset-password-form.test.tsx` | smoke test |
| `frontend/src/components/auth/__tests__/verify-email-view.test.tsx` | smoke test |

### Modify

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(public)/onboarding/page.tsx` | (필요 시) onboarding-flow wrap 갱신 |
| `frontend/src/components/onboarding/onboarding-flow.tsx` | mock OnboardingScreen (line 59-241) 마크업 정렬 |
| `frontend/src/components/onboarding/stepper.tsx` | mock Stepper (line 40-58) 정렬 |
| `frontend/src/components/onboarding/brand-panel.tsx` | mock 의 split brand panel 패턴 정렬 (재활용 — auth 화면들도 share) |
| `frontend/src/components/onboarding/step-purpose.tsx` / `step-career.tsx` / `step-positions.tsx` / `step-recap.tsx` (4) | mock 각 step 마크업 정렬 |
| `frontend/src/components/onboarding/welcome-modal.tsx` | mock welcome modal 정합 |
| `frontend/src/components/login/login-form.tsx` | mock AuthView mode=login 마크업 |
| `frontend/src/components/signup/signup-form.tsx` | mock AuthView mode=signup 마크업 |
| `frontend/src/components/signup/consent-section.tsx` | mock 약관 동의 섹션 정렬 |
| `frontend/src/styles/kit.css` | mock kit-account.css 의 `.auth-*` / `.reset-*` / `.verify-*` selector port (mp PR 에서 skip 한 부분) |

### Delete

| 파일 | 사유 |
|---|---|
| `frontend/src/app/(public)/onboarding/onboarding.css` | onboarding-specific CSS → kit.css 로 통합 |
| `frontend/src/components/onboarding/icons.tsx` | 전역 `@/components/ui/icons` 사용 (다른 cluster-local icons 패턴 따름) |

---

## 4. Commit 분할 (8 task)

1. **`refactor(auth): cluster-wide kit.css port — .auth-* / .reset-* / .verify-* selectors`** — mock kit-account.css 의 모든 auth selector frontend kit.css 로 port
2. **`refactor(onboarding): 4-step 마크업 mock 정렬`** — onboarding-flow / stepper / brand-panel / step-* 4 / welcome-modal 마크업 정합
3. **`refactor(onboarding): icons.tsx 제거 + onboarding.css 삭제`** — 전역 Ico 교체, css 통합
4. **`refactor(auth): login-form 마크업 정렬`**
5. **`refactor(auth): signup-form + consent-section 정렬`**
6. **`feat(auth): /reset-password 신규 라우트`** — 3-step state machine (이메일 → 코드 → 새 비밀번호 → 완료). UI mock-only
7. **`feat(auth): /verify-email 신규 라우트`** — 이메일 인증 대기 화면 + 재발송 (UI mock-only)
8. **`test(auth): 통합 테스트 갱신 + smoke test 보강`**

각 commit 후 build/test 통과 보장.

---

## 5. 검증

### 5.1 자동
- `npm run lint` — 0 errors
- `npm run test` — 179 + 신규 ~6 (reset 2 + verify 2 + 갱신) = ~185
- `npm run build` — Compiled successfully (신규 2 routes)

### 5.2 시각
- mock vs dev 서버 비교 (5 routes: `/onboarding`, `/login`, `/signup`, `/reset-password`, `/verify-email`)
- 4-step stepper 진행, login/signup 의 brand panel 매칭, reset 의 state 전환

### 5.3 회귀 sanity
- 기존 5.1 / 5.2 통합 테스트 회귀 0 (셀렉터 갱신 필요 시 task 8 일괄)

---

## 6. Out of scope (별도 issue)

- BE: `POST /api/v1/auth/reset-password/request` + `POST /api/v1/auth/reset-password/verify` + `POST /api/v1/auth/reset-password/confirm`
- BE: `POST /api/v1/auth/verify-email/request` + `POST /api/v1/auth/verify-email/confirm`
- 실제 비밀번호 재설정 메일 발송 (SES / SendGrid 등)
- 이메일 인증 토큰 만료 처리
- 소셜 로그인 (OAuth provider 통합)

---

## 7. 리스크 · 롤백

| 리스크 | 완화 |
|---|---|
| onboarding 4-step 마크업 변경으로 기존 통합 테스트 회귀 | task 8 에서 일괄 갱신 |
| onboarding.css 삭제 시 미커버 selector | task 1 의 kit.css port 가 미리 cover. task 3 에서 cross-check |
| reset-password 3-step state machine 복잡 | mock 의 state 패턴 그대로. 각 step 별 분기 단순 useState |
| BE 부재로 reset/verify 실 동작 안함 | PR description 명시. 후속 BE issue spawn |

### 롤백
- 각 commit 단위 revert
- PR 전체 revert 시 develop 영향 0

---

## 8. Next step

이 spec 통과 → plan + dispatch. 머지 후 **design_system 정렬 100% 완성**.
