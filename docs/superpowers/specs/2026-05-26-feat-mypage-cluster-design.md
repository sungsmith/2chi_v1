# 2단계 PR 7번 (`feat/mypage-cluster`) Spec

**브랜치 베이스**: `develop` (#22 머지됨, commit `99381f4`)
**상위 spec**: [`docs/superpowers/specs/2026-05-25-design-system-realign-design.md`](2026-05-25-design-system-realign-design.md) (§5 표의 mypage 항목)
**작성일**: 2026-05-26

---

## 1. 목적

`/mypage` cluster (5 sub-section) 신규 추가. `design_system/project/ui_kits/web/screen-account.jsx` (713줄) 의 myPage 파트 (line 148-665, account/social/notifications/notification-center/withdraw) 를 frontend 에 픽셀 단위로 구현. UI mock-only — BE 5 endpoint 는 별도 issue.

> auth 파트 (ResetPassword / VerifyEmail / AuthView) 는 onboarding-auth PR (2단계 8번) 에서 처리.

---

## 2. 현 상태 진단

### 2.1 frontend 현재
- `/mypage` cluster 자체가 **전부 미구현**. TopNav 의 프로필 메뉴에 mypage 진입 링크 없음.

### 2.2 mock screen-account.jsx — mypage 파트

| 항목 | mock line |
|---|---|
| `MP_NAV` (5-item) | 8-15 |
| `MyPageSideNav` | 148-169 |
| `AccountView` (계정 정보) | 306-353 |
| `SocialView` (소셜 연결) | 354-395 |
| `NotiSettingsRow` (helper) | 396-410 |
| `NotiSettingsView` (알림 설정) | 411-541 |
| `NotiCenterView` (알림 센터) | 542-623 |
| `DangerView` (회원 탈퇴) | 624-665 |
| `AccountScreen` (wrapper) | 666-712 |

### 2.3 결정

| # | 결정 | 사유 |
|---|---|---|
| 1 | 5 sub-view 모두 신규 (UI mock-only) | frontend 미구현 + BE 5 endpoint 모두 별도. mock JSON 으로 화면만 |
| 2 | `mp-side-nav` 신규 (mock MyPageSideNav 패턴) | `.side-nav` 클래스 me/company/applications port 재사용 |
| 3 | `/mypage` default = AccountView | mock AccountScreen 의 initialView="mypage" default |
| 4 | TopNav 의 ProfileMenu 에 `/mypage` 진입 링크 추가 | mock 진입점 패턴 |
| 5 | 모든 form 요소 (input · toggle · button) disabled / noop | BE 부재 — 실제 동작 없음. PR description 명시 |

---

## 3. 변경 파일 (~17)

### 신규

| 파일 | 책임 |
|---|---|
| `frontend/src/app/(app)/mypage/layout.tsx` | cluster shell + mp-side-nav |
| `frontend/src/app/(app)/mypage/page.tsx` | `/mypage` (account default) |
| `frontend/src/app/(app)/mypage/social/page.tsx` | 소셜 연결 |
| `frontend/src/app/(app)/mypage/notifications/page.tsx` | 알림 설정 |
| `frontend/src/app/(app)/mypage/notification-center/page.tsx` | 알림 센터 |
| `frontend/src/app/(app)/mypage/withdraw/page.tsx` | 회원 탈퇴 |
| `frontend/src/components/mypage/mp-side-nav.tsx` | 5-item sidenav |
| `frontend/src/components/mypage/account-view.tsx` | 계정 정보 |
| `frontend/src/components/mypage/social-view.tsx` | 소셜 연결 |
| `frontend/src/components/mypage/noti-settings-view.tsx` | 알림 설정 |
| `frontend/src/components/mypage/noti-settings-row.tsx` | 알림 항목 row |
| `frontend/src/components/mypage/noti-center-view.tsx` | 알림 센터 |
| `frontend/src/components/mypage/danger-view.tsx` | 회원 탈퇴 |
| `frontend/src/lib/mock/mypage.ts` | ACCOUNT_MOCK / SOCIAL_MOCK / NOTI_SETTINGS_MOCK / NOTI_CENTER_MOCK |
| `frontend/src/components/mypage/__tests__/*.test.tsx` | smoke test 각 view |

### Modify

| 파일 | 변경 |
|---|---|
| `frontend/src/components/app-shell/profile-menu.tsx` | "마이페이지" 항목에 `/mypage` 링크 추가 |
| `frontend/src/styles/kit.css` | mock kit-account.css 의 `.mp-*` selector port |

---

## 4. Commit 분할 (7 task)

1. **`feat(mp): cluster shell — mp-side-nav + layout`** — sidenav + layout + ProfileMenu 진입 링크
2. **`feat(mp): AccountView + /mypage (default)`**
3. **`feat(mp): SocialView + /mypage/social`**
4. **`feat(mp): NotiSettingsView + NotiSettingsRow + /mypage/notifications`** (가장 큼 ~130줄)
5. **`feat(mp): NotiCenterView + /mypage/notification-center`**
6. **`feat(mp): DangerView + /mypage/withdraw`**
7. **`chore(mp): kit.css port + smoke test 보강`**

---

## 5. 검증
- `npm run lint` / `npm run test` (169 + 신규 ~10) / `npm run build`
- dev 서버 5 routes (`/mypage`, `/mypage/social`, `/mypage/notifications`, `/mypage/notification-center`, `/mypage/withdraw`)

---

## 6. Out of scope (별도 issue)

- BE 5 endpoint: account · social · noti-settings · noti-center · withdraw
- 실제 toggle/save 동작 (현재 UI mock-only)
- 회원 탈퇴 confirm 절차 (mock UI 만)
- 알림 push (FCM 등) 통합

---

## 7. Next step
spec 통과 → plan + dispatch.
