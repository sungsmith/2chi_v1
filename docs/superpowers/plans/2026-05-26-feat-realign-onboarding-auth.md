# 2단계 PR 8번 (`feat/realign-onboarding-auth`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** onboarding/login/signup 마크업 mock 정렬 + reset-password/verify-email 신규 2 라우트 (UI mock-only). 머지 시 design_system 정렬 100%.

**Architecture:** mock JSX 마크업 그대로. 8-commit 점진 분할 (각 commit 빌드 통과). 큰 mock view (OnboardingScreen 180줄 · ResetPasswordView 90줄 · AuthView 130줄) 는 line range reference + 변환 패턴. 작은 자산 전체 코드.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Vitest + RTL. AGENTS.md breaking changes 주의.

**Spec:** `docs/superpowers/specs/2026-05-26-feat-realign-onboarding-auth-design.md`

**Branch base:** `develop` (#23 머지됨, head `518d760`)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `frontend/src/styles/kit.css` | append | mock kit-account.css 의 `.auth-*` / `.reset-*` / `.verify-*` selector port |
| `frontend/src/components/onboarding/onboarding-flow.tsx` | modify | mock OnboardingScreen (line 59-241) |
| `frontend/src/components/onboarding/stepper.tsx` | modify | mock Stepper (line 40-58) |
| `frontend/src/components/onboarding/brand-panel.tsx` | modify | mock brand panel (auth 화면들도 공유) |
| `frontend/src/components/onboarding/step-purpose.tsx` / `step-career.tsx` / `step-positions.tsx` / `step-recap.tsx` | modify | mock 각 step 마크업 |
| `frontend/src/components/onboarding/welcome-modal.tsx` | modify | mock welcome modal |
| `frontend/src/components/onboarding/icons.tsx` | delete | 전역 `@/components/ui/icons` 사용 |
| `frontend/src/app/(public)/onboarding/onboarding.css` | delete | kit.css 로 통합 |
| `frontend/src/components/login/login-form.tsx` | modify | mock AuthView mode=login |
| `frontend/src/components/signup/signup-form.tsx` | modify | mock AuthView mode=signup |
| `frontend/src/components/signup/consent-section.tsx` | modify | mock 약관 동의 |
| `frontend/src/app/(public)/reset-password/page.tsx` | create | 비밀번호 재설정 라우트 |
| `frontend/src/app/(public)/verify-email/page.tsx` | create | 이메일 인증 라우트 |
| `frontend/src/components/auth/reset-password-form.tsx` | create | mock ResetPasswordView (3-step) |
| `frontend/src/components/auth/verify-email-view.tsx` | create | mock VerifyEmailView |
| `frontend/src/components/auth/__tests__/reset-password-form.test.tsx` | create | smoke test |
| `frontend/src/components/auth/__tests__/verify-email-view.test.tsx` | create | smoke test |
| 기존 onboarding/login/signup 통합 테스트 | modify | task 8 일괄 |

---

## Task 1: cluster-wide kit.css port — `.auth-*` / `.reset-*` / `.verify-*` selectors (commit 1)

**Files:**
- Modify: `frontend/src/styles/kit.css`

mp PR Task 7 가 NO_OP 으로 skip 한 9 개 `.auth-*` selector + `.reset-*` / `.verify-*` 까지 일괄 port.

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop && git pull origin develop
git checkout -b feat/realign-onboarding-auth
```

- [ ] **Step 2: kit-account.css 의 auth/reset/verify selector 전체 추출 + port**

```bash
grep -nE "^\.(auth|reset|verify|signin|signup)-" design_system/project/ui_kits/web/kit-account.css > /tmp/auth_lines.txt
wc -l /tmp/auth_lines.txt
```

각 selector 의 rule block 을 frontend kit.css 끝에 append. selector 정의가 multi-line block 이라 grep 으로만은 부족 — `sed` 또는 손으로 block 추출.

대략 200~250줄 예상.

- [ ] **Step 3: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 179 tests passed (변동 없음).

- [ ] **Step 4: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(auth): cluster-wide kit.css port — .auth-* / .reset-* / .verify-* selectors

mp PR (#23) Task 7 에서 skip 한 9 개 .auth-* selector + .reset-* / .verify-*
일괄 port. mock kit-account.css 의 auth-관련 cluster CSS 를 frontend kit.css
로 통합. dashboard.css / career.css 패턴.

후속 task 2-7 에서 정합되는 컴포넌트들이 이 selector 들을 즉시 사용 가능.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: onboarding 4-step 마크업 mock 정렬 (commit 2)

**Files:**
- Modify: `onboarding-flow.tsx` · `stepper.tsx` · `brand-panel.tsx` · `step-purpose/career/positions/recap.tsx` · `welcome-modal.tsx`

mock JSX: `screen-onboarding.jsx` 전체 (241줄).
- STEPS (line 6-12) · PURPOSES (line 13-19) · CAREERS (line 20-30) · POSITIONS (line 31-39) — mock 데이터
- Stepper (line 40-58)
- OnboardingScreen (line 59-241) — 4-step state machine + brand panel + welcome modal

- [ ] **Step 1: mock 마크업 분석**

mock OnboardingScreen 의 구조:
- 좌측 brand panel (mascot · tape · memo · doodle)
- 우측 step container (Stepper + 현재 step content + 액션 버튼)
- welcome modal (완료 시 표시)

- [ ] **Step 2: 컴포넌트별 마크업 정렬**

각 컴포넌트의 기존 props · state · API 호출 유지. 마크업 className 만 mock 정합.

implementer 가 mock 각 step body 마크업을 frontend step-* 컴포넌트로 매핑. mock 의 PURPOSES / CAREERS / POSITIONS 데이터 형태와 frontend onboarding API 의 형태 비교 후 정합.

- [ ] **Step 3: 테스트 갱신 또는 임시 skip**

```bash
cd frontend && npm run test -- onboarding
```

깨지는 케이스 → 셀렉터 갱신 또는 `it.skip` + `// TODO Task 8`.

- [ ] **Step 4: 빌드 + lint + test + commit**

```bash
git add frontend/src/components/onboarding/ \
        frontend/src/styles/kit.css 2>/dev/null
git commit -m "$(cat <<'EOF'
refactor(onboarding): 4-step 마크업 mock 정렬

mock: screen-onboarding.jsx (241줄) 의 OnboardingScreen + Stepper +
brand panel + 4 step.

기존 onboarding API 호출 그대로. 마크업 className 1:1 정합:
- onboarding-flow: 좌측 brand panel + 우측 step container
- stepper: STEPS 4개 진행 표시
- step-purpose / career / positions / recap: 각 mock step body
- brand-panel: mascot · tape · memo · doodle
- welcome-modal: 완료 시 표시

일부 통합 테스트 임시 skip — task 8 에서 일괄 갱신.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: onboarding icons.tsx 제거 + onboarding.css 삭제 (commit 3)

**Files:**
- Delete: `frontend/src/components/onboarding/icons.tsx`
- Delete: `frontend/src/app/(public)/onboarding/onboarding.css`
- Modify: onboarding 컴포넌트들 (import 경로 변경)

dashboard.css / career.css 패턴.

- [ ] **Step 1: cluster-local icons 사용처 확인**

```bash
grep -rn 'from "./icons"\|from "../icons"\|from "@/components/onboarding/icons"' frontend/src/
```

각 사용처 → 전역 `@/components/ui/icons` 로 교체.

- [ ] **Step 2: onboarding.css 사용처 확인 + cross-check**

```bash
grep -rn "onboarding.css" frontend/src/
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" frontend/src/app/\(public\)/onboarding/onboarding.css | sort -u > /tmp/onb_selectors.txt
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" frontend/src/styles/kit.css | sort -u > /tmp/kit_fe.txt
comm -23 /tmp/onb_selectors.txt /tmp/kit_fe.txt > /tmp/onb_missing.txt
cat /tmp/onb_missing.txt
```

missing selector 중 사용 중인 것만 kit.css 에 port. 미사용은 drop.

- [ ] **Step 3: 삭제 + 빌드 + lint + test + commit**

```bash
git rm frontend/src/components/onboarding/icons.tsx
git rm frontend/src/app/\(public\)/onboarding/onboarding.css
# page.tsx 의 import "./onboarding.css" 가 있으면 제거

git add frontend/src/components/onboarding/ frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(onboarding): icons.tsx 제거 + onboarding.css 삭제

- onboarding/icons.tsx 삭제. 모든 import 를 @/components/ui/icons 로 교체
- onboarding.css 삭제. 사용 중인 selector 는 kit.css 로 port (cross-check
  결과 X 개 ported, Y 개 orphan)

dashboard.css (788줄) / career.css (966줄) 와 같은 패턴.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: login-form 마크업 정렬 (commit 4)

**Files:**
- Modify: `frontend/src/components/login/login-form.tsx`
- Modify (필요 시): `frontend/src/app/(public)/login/page.tsx`
- Modify: `frontend/src/components/login/__tests__/login-form.test.tsx`

mock JSX: AuthView (`screen-account.jsx` line 170-305) mode=login.

mock AuthView 의 login 분기 핵심:
- 좌측 brand panel (onboarding 의 brand-panel 재활용)
- 우측 .auth-card (eyebrow · title · 이메일 input · 비밀번호 input · 로그인 버튼 · 소셜 로그인 · "회원가입" · "비밀번호 재설정" 링크)

- [ ] **Step 1: login-form.tsx 갱신**

기존 props · 인증 API 호출 유지. 마크업 mock 정합.
- "비밀번호 재설정" → `<Link href="/reset-password">`
- "회원가입" → `<Link href="/signup">`
- 소셜 로그인 버튼은 disabled (BE 부재)

- [ ] **Step 2: page.tsx 갱신 (brand panel + login-form layout 조합)**

```tsx
import { BrandPanel } from "@/components/onboarding/brand-panel";
import { LoginForm } from "@/components/login/login-form";

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <BrandPanel />
      <LoginForm />
    </div>
  );
}
```

- [ ] **Step 3: 테스트 갱신 + 빌드 + commit**

```bash
git add frontend/src/components/login/ frontend/src/app/\(public\)/login/
git commit -m "$(cat <<'EOF'
refactor(auth): login-form 마크업 mock 정렬

mock: screen-account.jsx 의 AuthView (line 170-305) mode=login.

- login-form: 마크업 className 1:1 mock 정합. 기존 인증 API 그대로
- login/page.tsx: brand-panel (onboarding 재활용) + login-form split layout
- "회원가입" / "비밀번호 재설정" 링크 추가
- 소셜 로그인 버튼 disabled (BE 부재)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: signup-form + consent-section 정렬 (commit 5)

**Files:**
- Modify: `signup-form.tsx` · `consent-section.tsx` · `(public)/signup/page.tsx` · signup test

mock JSX: AuthView (line 170-305) mode=signup + 약관 동의.

login 과 동일 패턴 + 추가:
- 닉네임 input
- 약관 동의 chip (consent-section)
- "로그인" 링크 (기존 회원)

- [ ] **Step 1: signup-form + consent-section 갱신**

마크업 mock 정합. 기존 회원가입 API · validation 유지.

- [ ] **Step 2: page.tsx + 빌드 + commit**

```bash
git commit -m "$(cat <<'EOF'
refactor(auth): signup-form + consent-section 정렬

mock: AuthView mode=signup + 약관 동의 섹션.

- signup-form: 마크업 mock 정합
- consent-section: 약관 chip · 필수/선택 표시
- signup/page.tsx: brand-panel + signup-form split

기존 signup API · validation 그대로.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: /reset-password 신규 라우트 (commit 6)

**Files:**
- Create: `frontend/src/app/(public)/reset-password/page.tsx`
- Create: `frontend/src/components/auth/reset-password-form.tsx`
- Create: `frontend/src/components/auth/__tests__/reset-password-form.test.tsx`

mock JSX: ResetPasswordView (`screen-account.jsx` line 24-113, ~90줄).

mock 의 3-step state machine:
1. 이메일 입력 → "재설정 코드 보내기"
2. 코드 입력 → "확인"
3. 새 비밀번호 입력 → "변경 완료"
4. 완료 화면

- [ ] **Step 1: reset-password-form.tsx + 3-step state**

mock 마크업 그대로. useState 로 step (1|2|3|4) 관리. 각 step 의 form submit 은 noop (BE 부재) — 다음 step 으로 단순 전환.

- [ ] **Step 2: 실패 테스트 작성**

```tsx
describe("ResetPasswordForm", () => {
  it("starts on step 1 (email input)", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByLabelText(/이메일/)).toBeInTheDocument();
  });

  it("advances to step 2 (code input) on submit", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText(/이메일/), "test@example.com");
    await user.click(screen.getByRole("button", { name: /코드 보내기/ }));
    expect(screen.getByLabelText(/코드/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: page.tsx + 빌드 + lint + test + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(auth): /reset-password 신규 라우트 (UI mock-only)

mock: screen-account.jsx 의 ResetPasswordView (line 24-113).

- 3-step state machine: 이메일 → 코드 → 새 비밀번호 → 완료
- 각 step submit 은 noop 후 다음 step 전환 (BE 부재)
- brand-panel + reset-password-form split layout

UI mock-only — BE reset-password endpoint 3 (request/verify/confirm) 는 별도
issue spawn 예정.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: /verify-email 신규 라우트 (commit 7)

**Files:**
- Create: `frontend/src/app/(public)/verify-email/page.tsx`
- Create: `frontend/src/components/auth/verify-email-view.tsx`
- Create: `frontend/src/components/auth/__tests__/verify-email-view.test.tsx`

mock JSX: VerifyEmailView (`screen-account.jsx` line 114-147, ~35줄).

mock 의 단순 인증 대기 화면:
- 이메일 발송됨 안내
- "메일이 안 왔다면" 재발송 link
- "로그인으로" 돌아가기

- [ ] **Step 1: verify-email-view.tsx + smoke test (2 cases)**

mock 마크업 그대로. props: `{ email: string }` (URL query 또는 prop). 재발송 버튼은 disabled or 단순 알림.

- [ ] **Step 2: page.tsx + 빌드 + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(auth): /verify-email 신규 라우트 (UI mock-only)

mock: screen-account.jsx 의 VerifyEmailView (line 114-147).

- 이메일 인증 대기 화면 + 재발송 link + 로그인으로 link
- 재발송 버튼 disabled (BE 부재)
- email prop (URL query 또는 default)

UI mock-only — BE verify-email endpoint 2 (request/confirm) 는 별도 issue.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: 통합 테스트 갱신 + smoke test 보강 (commit 8)

**Files:**
- Modify: 기존 onboarding / login / signup 통합 테스트 (skip 일괄 해제)

- [ ] **Step 1: skip 식별**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend
grep -rn "it.skip\|test.skip" src/components/onboarding/__tests__/ src/components/login/__tests__/ src/components/signup/__tests__/ src/components/auth/__tests__/
```

- [ ] **Step 2: 각 skip 갱신 (rewrite / delete / replace)**

새 마크업에 맞춘 셀렉터 사용. className 기반 + mock 카피.

- [ ] **Step 3: 빌드 + lint + test + commit**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: skip 0, 모든 테스트 PASS.

```bash
git commit -m "$(cat <<'EOF'
test(auth): 통합 테스트 갱신 — mock 정렬 마크업에 맞춤

task 2/4/5 에서 임시 it.skip 처리한 케이스들 일괄 해제. className 기반
셀렉터 + mock 카피. skip 0건.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 최종 단계 — push + PR + CI + 머지

controller 수행:
- [ ] develop 동기화
- [ ] dev 서버 sanity (5 routes: `/onboarding`, `/login`, `/signup`, `/reset-password`, `/verify-email`)
- [ ] `git push -u origin feat/realign-onboarding-auth`
- [ ] `gh pr create --base develop --title "feat: realign onboarding + auth (2단계 8번 마지막)"`
- [ ] CI watch + squash merge

**머지 시 design_system 정렬 100% 완성!**

## 완료 조건

- 8 task commit
- 각 commit 빌드/test 통과
- 최종 skip 0
- 5 routes (onboarding · login · signup · reset · verify)
- 신규 컴포넌트 2 (reset-password-form · verify-email-view) + smoke test
- onboarding.css 삭제 + icons.tsx 삭제
- mock auth selector 전체 kit.css port
- PR 생성 + CI 통과
