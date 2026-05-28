# React useEffect + router redirect race — transient UI 가 사라지는 패턴

- 학습일: 2026-05-28
- 계기: 2chi 온보딩 완료 모달이 안 뜨고 곧장 `/` 로 redirect 되는 race ([ISSUE-0005](../issues/0005-onboarding-welcome-modal-race-condition.md))
- 관련 역량: FE-REACT-002
- 트랙: FRONTEND

## 핵심 개념

- **redirect guard pattern**: 페이지 컴포넌트가 `useEffect` 안에서 인증/온보딩 상태를 검사하고 `router.replace` 또는 early-return `null` 로 페이지 진입을 막는 패턴. Next.js App Router 에서 흔하다.
- redirect 의 fuse 는 의존성 (`user`, `session`, `flags`) 의 갱신이다. 그 의존성을 update 하는 순간 effect 가 다음 render cycle 에서 발화 → redirect 호출.
- 같은 페이지 안에서 "비동기 상태 갱신 → transient 모달 표시" 흐름을 만들면, **상태 갱신이 모달 mount 보다 한 tick 앞서 redirect 를 깨운다**.
- React 의 batching 은 같은 sync function 안의 setState 들을 한 묶음으로 처리하지만, `await` 를 끼우면 새 microtask 로 분리되어 batching 이 깨진다. `await refreshUser(); setShowModal(true);` 는 두 별개 render cycle 로 처리된다.
- early-return `null` 은 unmount 와 동치. unmount 된 children 의 setState 는 새 render 에 반영되지 않으며, parent 가 다시 mount 되어도 상태가 reset 되어 모달은 보이지 않는다.

## 본 프로젝트 적용

[onboarding-flow.tsx](../../frontend/src/components/onboarding/onboarding-flow.tsx) 의 `submit()` → `dismissWelcome()` 로 `refreshUser()` 호출 위치 이동.

invariant 재설계:

- **모달 표시 phase**: `user.onboardingCompleted === false` 유지. page guard 가 발동하지 않음.
- **모달 dismiss phase**: 명시적으로 `refreshUser()` → `router.push("/")`. 두 동작이 같은 click handler 안에서 순차 실행되어 race 없음.

### 동일 패턴 전수 점검 결과 (2026-05-28 완료)

ISSUE-0005 직후 같은 인과 사슬을 가진 흐름을 전수 점검한 결과, **[app/(app)/layout.tsx](../../frontend/src/app/(app)/layout.tsx) 의 guard 가 `setUser(null)` 에 자동 반응**하는 구조 때문에 다음 3건이 같은 race 를 갖고 있었다:

| 흐름 | 파일 | 증상 |
|---|---|---|
| 비밀번호 변경 | [password-change-modal.tsx](../../frontend/src/components/mypage/password-change-modal.tsx) | guard 의 `/login?from=/mypage` 가 명시적 `/login?password-changed=true` 를 덮으면 **"비밀번호 변경됐어요" 배너 분실** |
| 회원탈퇴 | [withdraw-confirm-modal.tsx](../../frontend/src/components/mypage/withdraw-confirm-modal.tsx) | 동일 — **"30일 내 복구 가능" 안내 분실** (탈퇴 사용자에게 결정적 정보) |
| 일반 로그아웃 | [profile-menu.tsx](../../frontend/src/components/app-shell/profile-menu.tsx) | `from` 쿼리만 충돌, 양쪽 다 `/login` 이라 사용자 영향 0 — 미수정 |

이 케이스는 ISSUE-0005 (모달 mount 자체가 사라짐) 와 달리 **redirect 의 쿼리 파라미터가 사라지는** 변종이었다.

### 해결 — 표시 정보를 URL 쿼리에서 분리 (sessionStorage)

배너 정보를 URL 쿼리 대신 `sessionStorage` 로 전달. redirect 가 race 로 `/login` 이든 `/login?from=/mypage` 든 가더라도, 배너는 URL 과 무관하게 sessionStorage 에서 읽으므로 표시가 보장된다.

```ts
// modal: 명시적 쿼리 대신 sessionStorage
sessionStorage.setItem("loginBanner", "password-changed");
await logout();
router.push("/login");

// login-form: mount 직후 1회 읽고 제거 (SSR mismatch 방지 위해 useEffect 안)
useEffect(() => {
  const b = sessionStorage.getItem("loginBanner");
  if (b === "password-changed" || b === "withdrawn") {
    setBanner(b);
    sessionStorage.removeItem("loginBanner");
  }
}, []);
```

이 해법의 핵심은 **race 를 없애려 하지 않고, race 의 결과(redirect target)가 무엇이든 영향받지 않도록 의존을 끊은 것**이다. guard 의 redirect 와 명시적 redirect 가 여전히 경합하지만, 둘 다 `/login` 으로 가므로 사용자는 항상 로그인 화면에 도착하고 배너는 sessionStorage 가 책임진다. 검증: 관련 단위 테스트 16/16 통과 (`sessionStorage.getItem("loginBanner")` assertion 추가).

## 함정 / 주의사항

- "비동기 상태 갱신 후 모달" 의 직관적 코드 (`await refreshUser(); setShowModal(true);`) 는 race 가 보이지 않는다. browser 에서 직접 실행해야만 잡힌다.
- 단위 테스트 (vitest + jsdom) 는 라우터/auth context 를 mock 하므로 이 race 를 감지하지 못한다. E2E (Playwright) 나 manual QA 가 필요.
- 해결책으로 `useTransition` 이나 `flushSync` 를 떠올리기 쉽지만, 문제는 batching 이 아니라 **상태 갱신 → effect 발화 → redirect** 라는 인과 사슬 자체. 가장 깨끗한 해결은 갱신 시점을 분리하는 것 (invariant 재설계).
- "모달이 닫힌 뒤 redirect" 패턴은 어색하지 않다. 사용자에게는 "Welcome 메시지 → 확인 → 메인" 흐름이 자연스러움. UX 와 invariant 가 합치한다.
- guard 의 의존성에 `_modalOpen` 같은 transient flag 를 추가해서 막는 방식은 안티패턴 (가드 책임이 transient state 까지 알아야 함). 책임 분리 깨짐.
- **race 를 항상 제거할 필요는 없다.** redirect 쿼리 충돌 케이스는 race 자체를 없애는 대신 "표시 정보를 race 의 결과(URL)에서 분리" 해서 견고하게 만들었다. 두 redirect 가 여전히 경합하지만 결과가 동치(`/login`)라 무해. *race 의 결과가 무엇이든 동작이 같도록 의존을 끊는 것*이 *race 를 완벽히 직렬화하는 것*보다 단순하고 견고할 때가 많다.
- URL 쿼리 → sessionStorage 전환의 트레이드오프: sessionStorage 는 북마크·공유·뒤로가기로 재현 불가(1회성 표시에 적합), URL 쿼리는 공유 가능하지만 guard redirect 와 충돌. "1회성 사용자 알림" 은 sessionStorage 가 맞고, "공유돼야 할 상태" 는 URL 이 맞다.

## 참고

- [React 19 set state in effect pattern](./react19-set-state-in-effect-pattern.md) — 본 프로젝트의 인접 학습 노트 (effect 안 setState 의 함정)
- [React docs · You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — effect 의 책임 범위 가이드라인
- [Next.js App Router · Redirects](https://nextjs.org/docs/app/building-your-application/routing/redirecting) — redirect guard 패턴의 공식 가이드
