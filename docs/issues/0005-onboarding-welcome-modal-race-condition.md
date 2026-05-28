# [ISSUE-0005] 온보딩 완료 모달이 안 뜨고 곧장 `/` 로 redirect 되는 race

- 발생일: 2026-05-28
- 환경: local (dev)
- 심각도: medium (사용자 흐름 차단 — 온보딩 마무리 UX 손실)
- 관련 역량: FE-REACT-002 (비동기 상태 갱신과 라우팅 가드 설계)

## 증상

온보딩 4단계 (`/onboarding`) 마무리 후 "시작하기" 클릭 → WelcomeModal 이 떠야 하는데 보이지 않고 곧바로 `/` 로 이동.

[onboarding-flow.tsx](frontend/src/components/onboarding/onboarding-flow.tsx) `submit()` 흐름:

```ts
await postOnboarding({...});
await refreshUser();        // ① user.onboardingCompleted = true
setShowWelcome(true);       // ② 모달 띄우려는데...
```

## 원인

`refreshUser()` 가 auth context 의 user 객체를 갱신 → React rerender → [onboarding/page.tsx:12-16](frontend/src/app/(public)/onboarding/page.tsx#L12) 의 useEffect 가 `user.onboardingCompleted === true` 를 감지하고 즉시 `router.replace("/")` 호출.

동시에 같은 파일의 early return 가드 ([page.tsx:18](frontend/src/app/(public)/onboarding/page.tsx#L18)):

```tsx
if (!initialized || !user || user.onboardingCompleted) return null;
```

가 `null` 을 반환 → `<OnboardingFlow />` 자체가 unmount → 그 안의 `setShowWelcome(true)` 효과는 사라진 트리에서 일어나거나, mount 되더라도 부모가 이미 빠진 상태라 모달 자체가 사라짐.

요컨대 "user 갱신" → "redirect 트리거" 가 "모달 표시" 보다 먼저 실행되는 **상태 갱신 ↔ 라우팅 가드 race**.

## 해결

`refreshUser()` 호출을 모달 dismiss 시점으로 이동. 모달이 떠있는 동안에는 `user.onboardingCompleted` 가 false 상태 유지 → page 가드가 발동하지 않음.

```diff
 async function submit() {
   try {
     await postOnboarding({...});
-    await refreshUser();
     setShowWelcome(true);
   } catch (err) { ... }
 }

-function dismissWelcome() {
+async function dismissWelcome() {
   setShowWelcome(false);
+  await refreshUser();
   router.push("/");
 }
```

근본 조치: 페이지 가드가 비동기 상태(`user.*`)에 의존할 때, **상태 갱신 시점** 과 **모달/transient UI 표시 시점** 을 명시적으로 분리. "user 가 onboarded 가 되면 페이지를 떠난다" 라는 invariant 를 깨지 않는 범위 안에서 transient 한 모달은 user.onboardingCompleted = false 상태에서 끝내고, dismiss 시 비로소 user 를 갱신한다.

## 학습

- `auth context refresh` 처럼 **앱-전역에 broadcast 되는 상태 갱신**은 호출 시점이 곧 routing side-effect 의 fuse 와 같다. 단순히 await 만 하지 말고, 그 갱신이 어떤 guard·effect·redirect 를 깨우는지 확인.
- 페이지 가드가 `null` 을 return 하는 패턴은 unmount 와 동일. unmount 된 children 안에서 일으킨 `setState` 는 효과가 없다 (혹은 다음 mount 에 영향). transient UI 는 가드에 걸리지 않는 phase 에서 띄워야 한다.
- 비슷한 패턴이 다른 곳에도 잠재: 비밀번호 변경 후 redirect, 회원탈퇴 후 redirect, 로그아웃 후 redirect 등. **"성공 모달 → user 갱신 → redirect"** 흐름은 모두 점검 대상.
- vitest 는 라우터/auth 를 mock 하므로 이 race 를 잡지 못함. 통합 시나리오 (브라우저에서 실제 흐름) 로만 확인 가능 — E2E 테스트의 가치를 다시 확인.

## 자소서 활용 후보

- 항목: PROBLEM_SOLVING
- 정량: "온보딩 완료 모달 표시율 0% → 100% (race 해소 1커밋, 라우팅 가드 invariant 재설계)"
- 직군 권장 구조: UX-Driven (UX 문제 / 기술 접근 / 구현 결정 / 사용자 임팩트)
