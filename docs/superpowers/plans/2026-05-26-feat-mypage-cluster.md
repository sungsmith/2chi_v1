# 2단계 PR 7번 (`feat/mypage-cluster`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `/mypage` cluster 5 sub-section (account · social · notifications · notification-center · withdraw) 신규 구현. UI mock-only.

**Architecture:** mock `screen-account.jsx` 의 myPage 파트 (line 148-665) 마크업 그대로. 7-commit 점진 분할. mock 의 view 마다 단일 컴포넌트 + smoke test. mock 데이터는 frontend mock JSON (BE 부재).

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Vitest + RTL. AGENTS.md 의 breaking changes 주의.

**Spec:** `docs/superpowers/specs/2026-05-26-feat-mypage-cluster-design.md`

**Branch base:** `develop` (#22 머지됨, head `99381f4`)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `frontend/src/app/(app)/mypage/layout.tsx` | create | cluster shell + mp-side-nav |
| `frontend/src/app/(app)/mypage/page.tsx` | create | AccountView (default) |
| `frontend/src/app/(app)/mypage/social/page.tsx` | create | SocialView |
| `frontend/src/app/(app)/mypage/notifications/page.tsx` | create | NotiSettingsView |
| `frontend/src/app/(app)/mypage/notification-center/page.tsx` | create | NotiCenterView |
| `frontend/src/app/(app)/mypage/withdraw/page.tsx` | create | DangerView |
| `frontend/src/components/mypage/mp-side-nav.tsx` | create | 5-item sidenav |
| `frontend/src/components/mypage/account-view.tsx` | create | 계정 정보 |
| `frontend/src/components/mypage/social-view.tsx` | create | 소셜 연결 |
| `frontend/src/components/mypage/noti-settings-view.tsx` | create | 알림 설정 (가장 큼) |
| `frontend/src/components/mypage/noti-settings-row.tsx` | create | 알림 항목 row |
| `frontend/src/components/mypage/noti-center-view.tsx` | create | 알림 센터 |
| `frontend/src/components/mypage/danger-view.tsx` | create | 회원 탈퇴 |
| `frontend/src/lib/mock/mypage.ts` | create | 5 view 의 mock 데이터 |
| `frontend/src/components/app-shell/profile-menu.tsx` | modify | "마이페이지" 항목에 `/mypage` 링크 |
| `frontend/src/styles/kit.css` | append | mock kit-account.css 의 `.mp-*` selector port |
| `frontend/src/components/mypage/__tests__/*.test.tsx` | create | 5 smoke test |

---

## Task 1: cluster shell — mp-side-nav + layout (commit 1)

**Files:**
- Create: `frontend/src/components/mypage/mp-side-nav.tsx`
- Create: `frontend/src/app/(app)/mypage/layout.tsx`
- Modify: `frontend/src/components/app-shell/profile-menu.tsx` (마이페이지 링크)

mock JSX: `design_system/project/ui_kits/web/screen-account.jsx` 의 MP_NAV (line 8-15) + MyPageSideNav (line 148-169).

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop && git pull origin develop
git checkout -b feat/mypage-cluster
```

- [ ] **Step 2: mp-side-nav.tsx 신규**

`frontend/src/components/mypage/mp-side-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { id: "account" | "social" | "notifications" | "notification-center" | "withdraw"; label: string; href: string };

const MP_NAV: NavItem[] = [
  { id: "account",             label: "계정 정보",     href: "/mypage" },
  { id: "social",              label: "소셜 연결",     href: "/mypage/social" },
  { id: "notifications",       label: "알림 설정",     href: "/mypage/notifications" },
  { id: "notification-center", label: "알림 센터",     href: "/mypage/notification-center" },
  { id: "withdraw",            label: "회원 탈퇴",     href: "/mypage/withdraw" },
];

export function MpSideNav() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="side-nav">
      <div className="crumb">마이페이지</div>
      {MP_NAV.map((item) => {
        const active =
          item.href === "/mypage"
            ? pathname === "/mypage"
            : pathname.startsWith(item.href);
        return (
          <Link key={item.id} href={item.href} className={`nav-item${active ? " active" : ""}`}>
            <span className="label">{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
```

- [ ] **Step 3: /mypage/layout.tsx**

```tsx
"use client";

import { MpSideNav } from "@/components/mypage/mp-side-nav";

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mp-shell">
      <MpSideNav />
      <main className="mp-main">{children}</main>
    </div>
  );
}
```

`.mp-shell` / `.mp-main` 이 kit.css 에 없으면 port. 부족 시 추가:

```css
.mp-shell { display: grid; grid-template-columns: 240px 1fr; min-height: calc(100vh - 56px); }
.mp-main  { overflow: auto; }
```

- [ ] **Step 4: profile-menu.tsx 의 mypage 링크 추가**

`frontend/src/components/app-shell/profile-menu.tsx` 의 항목 목록에 "마이페이지" → `/mypage` 링크 추가 (기존 메뉴 패턴 유지).

- [ ] **Step 5: 빌드 + lint + test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 169 tests passed (no change), build OK + `/mypage` route 도 빌드됨 (default page 아직 미존재 시 404. task 2 에서 추가).

만약 default page 없으면 빌드 경고 가능 — task 2 에서 page.tsx 추가 후 해결. 또는 layout 의 fallback 으로 placeholder:

```tsx
// layout.tsx 의 children 이 없을 때 placeholder
{children ?? <div>준비중</div>}
```

(권장: task 2 에서 page.tsx 추가하면 자연스러움.)

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/mypage/mp-side-nav.tsx \
        frontend/src/app/\(app\)/mypage/layout.tsx \
        frontend/src/components/app-shell/profile-menu.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(mp): cluster shell — mp-side-nav + layout

mock: screen-account.jsx 의 MP_NAV (line 8-15) + MyPageSideNav (line 148-169).

- mp-side-nav.tsx: 5-item sidenav (계정 정보 · 소셜 연결 · 알림 설정 ·
  알림 센터 · 회원 탈퇴) + crumb "마이페이지"
- /mypage/layout.tsx: .mp-shell + .mp-main grid (me/company/applications PR
  port 한 .side-nav 클래스 재사용)
- profile-menu.tsx: 프로필 드롭다운에 마이페이지 진입 링크 추가

5 sub-page 는 task 2-6 에서 추가.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: AccountView + /mypage (commit 2)

**Files:**
- Create: `frontend/src/lib/mock/mypage.ts` (ACCOUNT_MOCK)
- Create: `frontend/src/components/mypage/account-view.tsx`
- Create: `frontend/src/app/(app)/mypage/page.tsx`
- Create: `frontend/src/components/mypage/__tests__/account-view.test.tsx`

mock JSX: AccountView (line 306-353).

- [ ] **Step 1: mock/mypage.ts 신규**

`frontend/src/lib/mock/mypage.ts`:

```ts
export type AccountSnapshot = {
  email: string;
  nickname: string;
  joinedAt: string;
  plan: "free" | "pro";
};

export const ACCOUNT_MOCK: AccountSnapshot = {
  email: "somi.kim@example.com",
  nickname: "김소미",
  joinedAt: "2026-04-08",
  plan: "free",
};
```

- [ ] **Step 2: account-view.tsx 신규 + smoke test**

mock 의 AccountView (line 306-353) 마크업 그대로. props: `{ data: AccountSnapshot }`. 모든 input/button 은 `disabled` (BE 부재). implementer 가 mock 본문 확인 후 정확한 className · 필드 구성.

smoke test 2 (이메일·닉네임 표시 · 모든 인터랙티브 요소 disabled).

- [ ] **Step 3: /mypage/page.tsx**

```tsx
import { AccountView } from "@/components/mypage/account-view";
import { ACCOUNT_MOCK } from "@/lib/mock/mypage";

export default function MyPageAccount() {
  return <AccountView data={ACCOUNT_MOCK} />;
}
```

- [ ] **Step 4: kit.css port + 빌드/lint/test**

mock kit-account.css 의 .mp-* / account 관련 selector port. Expected: 171 tests passed (169 + 2).

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/lib/mock/mypage.ts \
        frontend/src/components/mypage/account-view.tsx \
        frontend/src/components/mypage/__tests__/account-view.test.tsx \
        frontend/src/app/\(app\)/mypage/page.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(mp): AccountView + /mypage (default) — UI mock-only

mock: screen-account.jsx 의 AccountView (line 306-353).

- /mypage default 라우트
- account-view.tsx: 이메일·닉네임·가입일·플랜 표시 (BE 부재로 form 요소
  disabled)
- mock/mypage.ts: AccountSnapshot 타입 + ACCOUNT_MOCK

UI mock-only — BE /api/v1/account endpoint 별도 issue spawn 예정.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: SocialView + /mypage/social (commit 3)

**Files:**
- Modify: `frontend/src/lib/mock/mypage.ts` (SOCIAL_MOCK)
- Create: `frontend/src/components/mypage/social-view.tsx`
- Create: `frontend/src/app/(app)/mypage/social/page.tsx`
- Create: `frontend/src/components/mypage/__tests__/social-view.test.tsx`

mock JSX: SocialView (line 354-395).

- [ ] **Step 1: SOCIAL_MOCK 추가**

`mock/mypage.ts` 끝에 append:

```ts
export type SocialProvider = "google" | "kakao" | "naver" | "github";

export type SocialConnection = {
  provider: SocialProvider;
  label: string;
  connected: boolean;
  email?: string;          // connected 시 표시
};

export const SOCIAL_MOCK: SocialConnection[] = [
  { provider: "google",  label: "Google",  connected: true,  email: "somi.kim@gmail.com" },
  { provider: "kakao",   label: "카카오",  connected: false },
  { provider: "naver",   label: "네이버",  connected: false },
  { provider: "github",  label: "GitHub",  connected: true,  email: "somi-kim" },
];
```

- [ ] **Step 2: social-view.tsx + test + page.tsx**

mock SocialView (line 354-395) 마크업. props: `{ connections: SocialConnection[] }`. 모든 연결/해제 버튼 disabled.

smoke test 2 (4 provider 표시 · 연결된 것은 email/id 표시).

- [ ] **Step 3: 빌드 + lint + test + commit**

Expected: 173 tests passed.

```bash
git add frontend/src/lib/mock/mypage.ts \
        frontend/src/components/mypage/social-view.tsx \
        frontend/src/components/mypage/__tests__/social-view.test.tsx \
        frontend/src/app/\(app\)/mypage/social/ \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(mp): SocialView + /mypage/social — UI mock-only

mock: screen-account.jsx 의 SocialView (line 354-395).

- 4 provider (Google · 카카오 · 네이버 · GitHub) 연결 상태 표시
- 연결/해제 버튼 disabled (BE 부재)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: NotiSettingsView + /mypage/notifications (가장 큼, commit 4)

**Files:**
- Modify: `frontend/src/lib/mock/mypage.ts` (NOTI_SETTINGS_MOCK)
- Create: `frontend/src/components/mypage/noti-settings-view.tsx`
- Create: `frontend/src/components/mypage/noti-settings-row.tsx`
- Create: `frontend/src/app/(app)/mypage/notifications/page.tsx`
- Create: `frontend/src/components/mypage/__tests__/noti-settings-view.test.tsx`

mock JSX: NotiSettingsRow (line 396-410) + NotiSettingsView (line 411-541, ~130줄).

- [ ] **Step 1: NOTI_SETTINGS_MOCK + 타입**

`mock/mypage.ts` 끝에 append:

```ts
export type NotiChannel = "push" | "email" | "in_app";

export type NotiSettingItem = {
  id: string;
  category: string;        // "지원" / "자소서" / "기업분석" 등 그룹
  label: string;
  description: string;
  defaultOn: boolean;
  locked?: boolean;        // 일부 항목은 비활성 (예: 시스템 알림)
};

export const NOTI_SETTINGS_MOCK: NotiSettingItem[] = [
  // implementer 가 mock NotiSettingsView 본문 (line 411-541) 에서 정확한 항목 추출
  // 예: 지원 마감 D-3 / 자소서 작성 완료 / 새 채용공고 매칭 등
];
```

- [ ] **Step 2: noti-settings-row.tsx + noti-settings-view.tsx**

mock 의 두 컴포넌트 마크업 그대로. NotiSettingsRow props: `{ nm, desc, defaultOn, locked }` (mock 시그니처 그대로).

NotiSettingsView 는 카테고리별 그룹 + 다수 NotiSettingsRow. 토글 disabled.

- [ ] **Step 3: page.tsx + smoke test**

smoke test 2 (다수 카테고리 표시 · 모든 toggle disabled).

- [ ] **Step 4: 빌드 + lint + test + commit**

Expected: 175 tests passed.

```bash
git commit -m "$(cat <<'EOF'
feat(mp): NotiSettingsView + /mypage/notifications — UI mock-only

mock: screen-account.jsx 의 NotiSettingsRow (line 396) + NotiSettingsView
(line 411-541, ~130줄).

- 알림 항목별 on/off (지원·자소서·기업분석 등 카테고리 그룹)
- 일부 항목은 locked (시스템 알림 등)
- 모든 toggle disabled (BE 부재)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: NotiCenterView + /mypage/notification-center (commit 5)

mock JSX: NotiCenterView (line 542-623, ~80줄).

- [ ] **Step 1: NOTI_CENTER_MOCK 추가**

```ts
export type NotiCenterEntry = {
  id: string;
  time: string;          // "오늘 14:00" / "어제 09:30"
  icon: string;          // global Ico key
  iconTone: "default" | "mint" | "lav" | "pink" | "warn";
  msg: string;
  unread: boolean;
};

export const NOTI_CENTER_MOCK: NotiCenterEntry[] = [
  // implementer 가 mock NotiCenterView 본문에서 5-10 entries 추출
];
```

- [ ] **Step 2: noti-center-view.tsx + test + page**

mock 마크업 그대로. props: `{ entries: NotiCenterEntry[] }`. timeline 패턴 (HistoryView 와 유사).

unread 표시 + 액션 (모두 읽음 / 전체 삭제) — disabled.

- [ ] **Step 3: 빌드 + lint + test + commit**

Expected: 177 tests passed.

---

## Task 6: DangerView + /mypage/withdraw (commit 6)

mock JSX: DangerView (line 624-665, ~40줄).

- [ ] **Step 1: danger-view.tsx + test + page.tsx**

mock 마크업 그대로. 데이터 props 없음 (정적 페이지). "회원 탈퇴" 버튼은 disabled + tooltip "BE 미연동" 또는 비슷.

smoke test 2 (경고 메시지 표시 · 탈퇴 버튼 disabled).

- [ ] **Step 2: 빌드 + lint + test + commit**

Expected: 179 tests passed.

---

## Task 7: kit.css port + smoke test 보강 (commit 7)

**Files:**
- Modify: `frontend/src/styles/kit.css` (잔여 .mp-* selector port)
- (선택) test 보강

dashboard.css/career.css 패턴 — mock kit-account.css 의 .mp-* / account / social / noti / danger 관련 selector 중 task 1-6 에서 incremental port 안 된 것 일괄 port.

- [ ] **Step 1: cross-check**

```bash
cd /Users/sungjiwon/claude/2chi_v1
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" design_system/project/ui_kits/web/kit-account.css | sort -u > /tmp/mp_mock.txt
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" frontend/src/styles/kit.css | sort -u > /tmp/kit_fe.txt
comm -23 /tmp/mp_mock.txt /tmp/kit_fe.txt > /tmp/mp_missing.txt
wc -l /tmp/mp_missing.txt
```

각 missing 의 사용처 확인 → port (used) or drop (orphan).

주의: kit-account.css 에는 mypage + auth 둘 다 selector 있음. auth 관련 (`.auth-*`, `.reset-*`, `.verify-*`) 는 onboarding-auth PR 에서 처리하므로 이번에는 mypage 관련 (`.mp-*`, `.acc-*`, `.social-*`, `.noti-*`, `.danger-*`) 만 port.

- [ ] **Step 2: 빌드 + lint + test + commit**

```bash
git commit -m "$(cat <<'EOF'
chore(mp): kit.css port 정리

mock kit-account.css 의 mypage-specific selector (.mp-* / .acc-* / .social-* /
.noti-* / .danger-*) 중 사용 중인 것 일괄 port. auth-specific selector
(.auth-* / .reset-* / .verify-*) 는 onboarding-auth PR 에서 처리.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 최종 단계 — push + PR + CI + 머지

controller 수행:
- [ ] develop 동기화
- [ ] dev 서버 sanity (5 routes + ProfileMenu 의 mypage 진입)
- [ ] `git push -u origin feat/mypage-cluster`
- [ ] `gh pr create --base develop --title "feat: mypage cluster 5 sub-section 신규 (2단계 7번, UI mock-only)"`
- [ ] CI watch + squash merge

## 완료 조건
- 7 commit
- 5 routes 신규 + cluster sidenav
- ProfileMenu 진입 링크
- ~10 신규 test
- 모든 form/toggle/button disabled (BE 부재)
- PR 생성 + CI 통과
