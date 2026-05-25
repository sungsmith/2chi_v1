# 1단계 PR (`chore/design-system-sync`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 갱신된 `design_system/project/` 의 공통 자산(CSS·마스코트 PNG·전역 Ico 카탈로그)을 `frontend/` 에 동기화. 화면 마크업은 미변경.

**Architecture:**
- `frontend/src/styles/kit.css` 통째 교체 (대규모 신규 selector 추가, 기존 selector 충돌 없음 확인됨)
- `frontend/src/styles/colors_and_type.css` 는 frontend-local `@font-face` 분리로 변경 사실상 없음 — 검증만
- 마스코트 PNG 6장 `frontend/public/` 으로 복사
- `frontend/src/components/ui/icons.tsx` 신규 생성 (전역 Ico 카탈로그). frontend 컨벤션(개별 named export)으로 변환. 기존 cluster-local `icons.tsx` 4개는 손대지 않음 (2단계 화면 PR 에서 점진 교체)

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Vitest 4 + RTL + jsdom · ESLint 9

**Spec:** `docs/superpowers/specs/2026-05-25-design-system-realign-design.md` (§4 1단계)

---

## File Structure

| 파일 | 변경 종류 | 한 줄 책임 |
|---|---|---|
| `frontend/src/styles/colors_and_type.css` | (no-op, 검증만) | 토큰·타입 기본. frontend-local @font-face 분리 유지 |
| `frontend/src/styles/kit.css` | overwrite | UI kit 컴포넌트 CSS (top nav · buttons · panels · cards · badges · 마스코트 · tape · form atoms 등) |
| `frontend/public/mascot-{default,wave,happy,think,excited,sleep}.png` | create (6장) | 마스코트 6 표현 PNG |
| `frontend/src/components/ui/icons.tsx` | create | 전역 Lucide-style 아이콘 30개 (개별 named export) |
| `frontend/src/components/ui/__tests__/icons.test.tsx` | create | 아이콘 30개 smoke test (render + 기본 props) |

기존 cluster-local 파일들은 이번 PR 에서 **삭제하지 않음** (`components/{dashboard,me,onboarding}/icons.tsx`, route-local `*.css` 등). 2단계 화면별 PR 에서 점진 교체.

---

## Task 1: 브랜치 생성 + colors_and_type.css 변경 없음 검증

**Files:**
- Verify: `frontend/src/styles/colors_and_type.css`
- Verify: `frontend/src/app/globals.css:1-20`

`colors_and_type.css` 는 design_system 본과 비교 시 `@font-face` 블록 한 곳만 다르고, 그 차이는 frontend 가 의도적으로 분리해서 `globals.css` 에 절대 경로(`/fonts/`)로 선언한 것. 즉 frontend 파일은 그대로 두는 것이 정답. 이 task 는 그 사실을 검증하고 결정 근거를 남김.

- [ ] **Step 1: develop 최신 동기화 + 1단계 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop
git pull origin develop
git checkout -b chore/design-system-sync
```

Expected: `Switched to a new branch 'chore/design-system-sync'`

- [ ] **Step 2: colors_and_type.css diff 확인**

```bash
diff -u frontend/src/styles/colors_and_type.css design_system/project/colors_and_type.css
```

Expected: 단 한 군데만 차이가 출력됨 — design_system 파일은 `@font-face` 블록을 인라인 선언(상대 경로 `fonts/`), frontend 파일은 그 자리에 주석 `"@font-face is declared in globals.css (frontend) or inline per project"`.

- [ ] **Step 3: frontend globals.css 의 @font-face 위치 확인**

```bash
sed -n '1,20p' frontend/src/app/globals.css
```

Expected: `@font-face { font-family: "MemomentKkukkukk"; src: url("/fonts/MemomentKkukkukkR.woff2") ... }` 가 절대 경로(`/fonts/`)로 선언되어 있음. (host-specific 분리 — Next.js public/ 정적 호스팅에 맞춘 경로)

- [ ] **Step 4: 결정 — 변경 없음**

`colors_and_type.css` 는 이 PR 에서 수정하지 않는다. 그 외 토큰·타입 정의 부분은 두 파일이 완전 일치.

커밋 없음. PR description 의 "Notes" 절에 이 결정을 다음 한 줄로 기록: *"`colors_and_type.css` 무변경 — 두 파일의 유일한 차이인 `@font-face` 는 frontend 가 `globals.css` 에 절대 경로로 분리한 host-specific 선언이라 design_system 변경을 적용하지 않음."*

---

## Task 2: kit.css 통째 교체

**Files:**
- Replace: `frontend/src/styles/kit.css` (463 → 660줄)

design_system 의 `kit.css` 는 frontend 본 대비 약 200줄 신규 selector 추가(주로 top-nav dropdown — `.nav-anchor`, `.nav-dropdown`, `.noti-dropdown`, `.noti-mini-list` 등) + `.kit-icon-btn .dot` 의 시각 변경. 사전 조사 결과:
- frontend 의 `kit-icon-btn` 클래스 사용처 0 (TopNav 는 [nav-icon-button.tsx](frontend/src/components/app-shell/nav-icon-button.tsx) 의 inline style 사용)
- 다른 `.dot` 사용처 4건은 모두 selector specificity 가 더 높음 → 충돌 없음

따라서 통째 교체가 안전.

- [ ] **Step 1: design_system 의 kit.css 를 frontend 로 복사**

```bash
cp design_system/project/ui_kits/web/kit.css frontend/src/styles/kit.css
```

Expected: 명령 출력 없음(성공)

- [ ] **Step 2: 결과 검증**

```bash
wc -l frontend/src/styles/kit.css
diff -q frontend/src/styles/kit.css design_system/project/ui_kits/web/kit.css
```

Expected: `660 frontend/src/styles/kit.css` + diff 결과 비어있음(파일 동일).

- [ ] **Step 3: Next.js 빌드 통과 확인**

```bash
cd frontend && npm run build
```

Expected: `Compiled successfully` (CSS warning 0). 실패 시 stop & 디버그.

- [ ] **Step 4: 기존 테스트 전체 통과 확인**

```bash
cd frontend && npm run test
```

Expected: 23 tests pass (회귀 0).

- [ ] **Step 5: 수동 sanity check — TopNav notification dot 시각 회귀**

```bash
cd frontend && npm run dev
```

브라우저로 `http://localhost:3000/(app 진입 라우트)` 접속. TopNav 의 알림 벨 아이콘에 dot 표시가 정상인지 확인. (사전 조사로 `kit-icon-btn` 미사용이 확인되었으므로 회귀 가능성 낮지만 한 번 눈으로 확인.)

dev 서버 종료 (Ctrl+C).

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
chore(fe): kit.css 동기화 — design_system/project/ui_kits/web/kit.css 통째 교체

463 → 660줄. 신규 selector 약 200줄 추가 (top-nav dropdown:
.nav-anchor·.nav-dropdown·.noti-dropdown·.noti-mini-list 등) +
.kit-icon-btn .dot 시각 변경 (텍스트 배지 → 9x9 dot).

사전 조사:
- frontend 의 kit-icon-btn 클래스 사용처 0 (TopNav 는 nav-icon-button.tsx
  의 inline style 사용)
- 다른 .dot 사용처 4건은 selector specificity 가 더 높아 충돌 없음

build·test 회귀 0.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 마스코트 PNG 6장 복사

**Files:**
- Create: `frontend/public/mascot-default.png`
- Create: `frontend/public/mascot-wave.png`
- Create: `frontend/public/mascot-happy.png`
- Create: `frontend/public/mascot-think.png`
- Create: `frontend/public/mascot-excited.png`
- Create: `frontend/public/mascot-sleep.png`

design_system 의 `assets/mascot-*.png` 6장을 frontend Next.js public/ 으로 복사. `kit.css` 의 `.mascot-cloud.{expression}` 클래스는 `background-image: url('/mascot-{expression}.png')` 형태로 절대 경로를 가정한다(확인 필요 → Step 2).

- [ ] **Step 1: 6장 복사**

```bash
cd /Users/sungjiwon/claude/2chi_v1
cp design_system/project/assets/mascot-default.png frontend/public/mascot-default.png
cp design_system/project/assets/mascot-wave.png    frontend/public/mascot-wave.png
cp design_system/project/assets/mascot-happy.png   frontend/public/mascot-happy.png
cp design_system/project/assets/mascot-think.png   frontend/public/mascot-think.png
cp design_system/project/assets/mascot-excited.png frontend/public/mascot-excited.png
cp design_system/project/assets/mascot-sleep.png   frontend/public/mascot-sleep.png
```

Expected: 명령 출력 없음(성공)

- [ ] **Step 2: kit.css 의 마스코트 경로 패턴 확인**

```bash
grep -n "mascot-" frontend/src/styles/kit.css | head -20
```

Expected: `background-image: url('mascot-default.png')` 또는 `url('/mascot-default.png')` 또는 비슷한 형태로 6 표현 모두 선언되어 있음.

**조건부 분기:**
- 경로가 `url('mascot-*.png')` (상대) 형태이고 frontend Next.js 에서 동작하지 않는다면 → 절대 경로 `url('/mascot-*.png')` 로 보정 (다음 step 에서 수행)
- 경로가 이미 `url('/mascot-*.png')` (절대) 라면 → 추가 수정 불필요. Step 3 skip 하고 Step 4 로

- [ ] **Step 3 (조건부): kit.css 의 마스코트 경로를 절대 경로로 보정**

Step 2 에서 상대 경로였다면 다음 명령으로 일괄 치환:

```bash
cd frontend && sed -i.bak "s|url('mascot-|url('/mascot-|g" src/styles/kit.css && rm src/styles/kit.css.bak
grep -n "mascot-" src/styles/kit.css | head -20
```

Expected: 모든 mascot URL 이 `/mascot-` 로 시작.

(이 보정은 frontend-only 변경 — design_system 본은 mock 환경 기준 상대 경로 유지.)

- [ ] **Step 4: dev 서버로 PNG 직접 fetch 검증**

```bash
cd frontend && npm run dev
```

별도 터미널에서:

```bash
for expr in default wave happy think excited sleep; do
  curl -sI "http://localhost:3000/mascot-$expr.png" | head -1
done
```

Expected: 6장 모두 `HTTP/1.1 200 OK`. 404 가 하나라도 있으면 stop & 디버그.

dev 서버 종료.

- [ ] **Step 5: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/public/mascot-*.png frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
chore(fe): 마스코트 PNG 6장 추가 + kit.css 경로 절대화

design_system/project/assets/mascot-{default,wave,happy,think,excited,sleep}.png
6장을 frontend/public/ 으로 복사. kit.css 의 .mascot-cloud 클래스가
background-image 로 참조하는 경로를 Next.js 정적 호스팅에 맞춰
'/mascot-*.png' 절대 경로로 보정.

dev 서버에서 6장 모두 200 OK 응답 확인.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

(Step 3 이 skip 되어 kit.css 무변경이면 `git add frontend/src/styles/kit.css` 는 자동으로 무시되므로 명령 그대로 사용 가능.)

---

## Task 4: 전역 Ico 카탈로그 (`components/ui/icons.tsx`) 생성

**Files:**
- Create: `frontend/src/components/ui/icons.tsx`
- Create: `frontend/src/components/ui/__tests__/icons.test.tsx`

design_system 의 `kit-icons.jsx` 는 `const Ico = { Search: (p) => <svg.../>, ... }` 한 객체에 30개 아이콘을 모아 `window.Ico` 로 노출한다 (vanilla JS 환경). frontend 컨벤션은 개별 `export function IconName({ size, className })` (참조: [dashboard/icons.tsx](frontend/src/components/dashboard/icons.tsx)).

각 아이콘의 SVG path 는 design_system 본과 **완전 동일**하게 옮긴다. 변환은 wrapper 만:
- `(p) => <svg width={p.size||N} ...>` → `({ size = N, className }) => <svg width={size} height={size} className={className} ...>`
- 화살표 함수 → 명명된 export
- `window.Ico` 노출 제거

- [ ] **Step 1: 실패하는 smoke test 작성**

```bash
mkdir -p frontend/src/components/ui/__tests__
```

`frontend/src/components/ui/__tests__/icons.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as Icons from "../icons";

const ICON_NAMES = [
  "Search", "Bell", "ChevronDown", "ChevronRight", "ArrowRight", "ArrowLeft",
  "Plus", "Check", "Sparkle", "FileEdit", "Briefcase", "Calendar", "Target",
  "Layers", "Building", "Compass", "Folder", "Move", "Code", "Server",
  "Cloud", "Gear", "Layout", "Dots", "Link", "Edit", "Lock", "Refresh",
  "Save", "Download",
] as const;

describe("ui/icons — 전역 Ico 카탈로그", () => {
  it.each(ICON_NAMES)("%s 아이콘이 export 되어 있고 SVG 를 render 한다", (name) => {
    const Icon = (Icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
    expect(Icon).toBeDefined();
    const { container } = render(<Icon size={20} className="x" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("class")).toBe("x");
  });
});
```

(30개 아이콘 — design_system `kit-icons.jsx` 의 `Ico` 객체 키 그대로. Step 6 에서 양쪽 키 목록을 cross-check 한다.)

- [ ] **Step 2: 테스트가 fail 하는지 확인**

```bash
cd frontend && npm run test -- icons.test
```

Expected: FAIL — `Cannot find module '../icons'`

- [ ] **Step 3: `frontend/src/components/ui/icons.tsx` 생성**

design_system 의 `kit-icons.jsx` 본문(31개 항목 — 위 ICON_NAMES + Lucide-style fallback) 을 그대로 보면서 다음 파일을 작성:

`frontend/src/components/ui/icons.tsx`:

```tsx
// Lucide-style line icon set. 24×24 viewBox · 1.8 stroke · round caps + joins.
// Source: design_system/project/ui_kits/web/kit-icons.jsx (Ico 카탈로그)
// frontend 컨벤션: 개별 named export.

type IconProps = { size?: number; className?: string };

export function Search({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function Bell({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function ChevronDown({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronRight({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export function ArrowRight({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

export function ArrowLeft({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="11 6 5 12 11 18" />
    </svg>
  );
}

export function Plus({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function Check({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function Sparkle({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={className}>
      <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z" />
    </svg>
  );
}

export function FileEdit({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10.5 17.5l-2 .5.5-2 5-5 1.5 1.5z" />
    </svg>
  );
}

export function Briefcase({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 13h20" />
    </svg>
  );
}

export function Calendar({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function Target({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

export function Layers({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 2 9 5-9 5-9-5z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

export function Building({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="9" y1="8" x2="11" y2="8" />
      <line x1="13" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="11" y2="12" />
      <line x1="13" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="11" y2="16" />
    </svg>
  );
}

export function Compass({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-5 2 2-5z" />
    </svg>
  );
}

export function Folder({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 5a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function Move({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 17a8 8 0 0 1 14-5.3" />
      <path d="M14 8h4v4" />
      <path d="M20 7a8 8 0 0 1-14 5.3" />
      <path d="M10 16H6v-4" />
    </svg>
  );
}

export function Code({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export function Server({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="7" rx="2" />
      <rect x="3" y="14" width="18" height="7" rx="2" />
      <line x1="7" y1="6.5" x2="7.01" y2="6.5" />
      <line x1="7" y1="17.5" x2="7.01" y2="17.5" />
    </svg>
  );
}

export function Cloud({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6 1.4A4 4 0 0 0 7 19z" />
    </svg>
  );
}

export function Gear({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function Layout({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

export function Dots({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

export function Link({ size = 18, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function Edit({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

export function Lock({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function Refresh({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
    </svg>
  );
}

export function Save({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export function Download({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd frontend && npm run test -- icons.test
```

Expected: `30 passed` (it.each 로 30개 아이콘 모두 PASS).

- [ ] **Step 5: lint·전체 테스트·build 통과 확인**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: lint 0 error · 53 tests passed (기존 23 + 신규 30) · Compiled successfully.

- [ ] **Step 6: design_system 의 kit-icons.jsx 와 항목 누락 cross-check**

```bash
grep -oE "^  [A-Z][a-zA-Z]+:" design_system/project/ui_kits/web/kit-icons.jsx | sed 's/[: ]//g' | sort > /tmp/ds_icons.txt
grep -oE "^export function [A-Z][a-zA-Z]+" frontend/src/components/ui/icons.tsx | awk '{print $3}' | sort > /tmp/fe_icons.txt
diff /tmp/ds_icons.txt /tmp/fe_icons.txt
```

Expected: diff 비어있음 (양쪽 30개 동일). 만약 차이가 나오면 누락된 아이콘을 추가하고 Step 4 재실행.

- [ ] **Step 7: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/ui/icons.tsx frontend/src/components/ui/__tests__/icons.test.tsx
git commit -m "$(cat <<'EOF'
feat(fe): 전역 Ico 카탈로그 components/ui/icons.tsx 추가 (30 icons)

design_system/project/ui_kits/web/kit-icons.jsx 의 Ico 객체 30개 아이콘을
frontend 컨벤션 (개별 named export) 으로 옮김. SVG path 는 본과 완전 동일.

기존 cluster-local icons.tsx 3개 (dashboard·me·onboarding) 는 이번 PR 에서
손대지 않음 — 2단계 화면별 PR 에서 점진 교체 예정.

smoke test 30개 it.each — render + size·className props 확인.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: 최종 검증 + PR 생성

**Files:** (변경 없음, 검증만)

1단계 PR 의 모든 변경이 누적된 상태에서 빌드/lint/test/9 화면 sanity check 를 한 번 더 돌리고 PR 을 만든다.

- [ ] **Step 1: develop 최신과 rebase (다른 사람이 push 했을 가능성 대비)**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git fetch origin
git rebase origin/develop
```

Expected: `Successfully rebased and updated` 또는 충돌 없음. 충돌 발생 시 해결 후 `git rebase --continue`.

- [ ] **Step 2: 빌드·lint·test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: lint 0 error · 53 tests passed · Compiled successfully.

- [ ] **Step 3: dev 서버로 9개 기 화면 sanity check (시각 회귀 0)**

```bash
cd frontend && npm run dev
```

브라우저로 다음 9개 route 를 순서대로 열어 시각 회귀가 없는지 눈으로 확인:

1. `/onboarding` (4-step flow)
2. `/login`
3. `/signup`
4. `/dashboard` (또는 `(app)/page`)
5. `/me`, `/me/career`
6. `/cover-letters` (목록)
7. `/cover-letters/variants/new`
8. `/company/postings`, `/company/analysis`
9. `/applications`, `/applications/calendar`

각 화면: 레이아웃·색·폰트·간격·버튼 모양이 PR 전과 동일해야 함. 차이 발견 시 → kit.css 변경의 어떤 selector 가 영향을 줬는지 추적 + spec 의 "중단 조건" 절차 따라 사용자와 상의.

dev 서버 종료.

- [ ] **Step 4: 마스코트 PNG 6장 응답 재확인**

```bash
cd frontend && npm run dev &
SERVER_PID=$!
sleep 5
for expr in default wave happy think excited sleep; do
  printf "mascot-%s: " "$expr"
  curl -sI "http://localhost:3000/mascot-$expr.png" | head -1
done
kill $SERVER_PID
```

Expected: 6장 모두 `HTTP/1.1 200 OK`.

- [ ] **Step 5: push + PR 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git push -u origin chore/design-system-sync
gh pr create --base develop --title "chore: design_system → frontend 공통 자산 동기화 (1단계)" --body "$(cat <<'EOF'
## Summary

갱신된 `design_system/project/` 의 공통 자산을 frontend 에 동기화. 화면 마크업은 미변경.

- `frontend/src/styles/kit.css` 통째 교체 (463 → 660줄). 신규 selector ~200줄 (top-nav dropdown), `.kit-icon-btn .dot` 시각 변경.
- 마스코트 PNG 6장 `frontend/public/mascot-*.png` 추가 + kit.css 경로 절대화 (`/mascot-*.png`).
- 전역 Ico 카탈로그 `frontend/src/components/ui/icons.tsx` 신규 (30 icons, frontend 컨벤션의 개별 named export).
- smoke test 30개 추가 — render + size/className props 검증.

## Notes

- `colors_and_type.css` 무변경 — 두 파일의 유일한 차이인 `@font-face` 는 frontend 가 `globals.css` 에 절대 경로(`/fonts/`)로 분리한 host-specific 선언이라 design_system 변경을 적용하지 않음.
- 기존 cluster-local `icons.tsx` 3개(`dashboard`·`me`·`onboarding`) 는 이번 PR 에서 손대지 않음. 2단계 화면별 PR 에서 점진 교체 예정.
- 공용 컴포넌트 21개(modal·toast·dropdown 등) 정의는 1단계 scope 에서 제외. 2단계 각 화면 PR 에서 그 화면이 실제 사용할 때 정의 (YAGNI, 사양 추측 회피).

## Test plan

- [x] `npm run lint` 통과
- [x] `npm run test` 53 tests passed (기존 23 + 신규 30)
- [x] `npm run build` Compiled successfully
- [x] 9개 기 화면 시각 회귀 sanity check 통과 (onboarding · login · signup · dashboard · me · cover-letters · company · applications)
- [x] 마스코트 PNG 6장 dev 서버에서 200 OK

## 후속 작업

- spec: `docs/superpowers/specs/2026-05-25-design-system-realign-design.md`
- 2단계 8개 화면 PR (feat/realign-dashboard 부터) 은 각각 별도 spec/plan cycle 로 진행

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL 출력. CI 통과 + 리뷰 진행.

- [ ] **Step 6: 사용자에게 PR URL 보고**

PR URL 을 사용자에게 보고하고 이번 plan 완료. 2단계 작업은 새 spec/plan cycle 로 시작.

---

## 완료 조건 (Done definition)

- 5 task 모두 commit · push 완료
- PR draft 가 develop 기준으로 만들어졌고 CI 통과
- 9개 기 화면 시각 회귀 0 (수동 sanity 통과)
- 마스코트 PNG 6장 dev 서버 200 OK
- 새 smoke test 30개 통과
- 기존 23개 테스트 회귀 0
