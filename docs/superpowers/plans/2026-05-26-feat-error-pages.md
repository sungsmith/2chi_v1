# 2단계 PR 6번 (`feat/error-pages`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 404/500 error 화면 신규 + 4 곳 라우팅 (app · public).

**Architecture:** mock ErrorScreen (41줄) 의 conditional 패턴을 `<ErrorContent code={404|500} reset?>` 단일 컴포넌트로. Next.js App Router 의 not-found.tsx (auto-detected) + error.tsx ('use client' + reset) 패턴. 2 commit.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Vitest + RTL. AGENTS.md 의 Next.js breaking changes — `node_modules/next/dist/docs/` 참조 권장 (error / not-found API).

**Spec:** `docs/superpowers/specs/2026-05-26-feat-error-pages-design.md`

**Branch base:** `develop` (#21 머지됨, head `af0dfc8`)

---

## Task 1: ErrorContent + kit.css port + smoke test (commit 1)

**Files:**
- Create: `frontend/src/components/error/error-content.tsx`
- Create: `frontend/src/components/error/__tests__/error-content.test.tsx`
- Modify: `frontend/src/styles/kit.css` (`.err-*` selector port)

mock JSX: `design_system/project/ui_kits/web/screen-error.jsx` (전체 41줄). mock CSS: `design_system/project/ui_kits/web/kit-account.css` (likely 위치, grep 으로 확인).

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop && git pull origin develop
git checkout -b feat/error-pages
```

- [ ] **Step 2: kit.css 의 .err-* 확인 + port**

```bash
grep -n "\.err-shell\|\.err-card" frontend/src/styles/kit.css | head -3
grep -n "\.err-shell\|\.err-card" design_system/project/ui_kits/web/kit-account.css design_system/project/ui_kits/web/kit.css 2>&1 | head -5
```

frontend 에 없으면 design_system 에서 찾아 port (몇 줄, mock 의 디자인 기반 — 전화면 centered card).

만약 design_system kit-account.css 에 정의되어 있으면 그 rule 들을 frontend kit.css 에 append. 없다면 mock JSX 의 className 기반으로 합리적인 default CSS 작성 (centered viewport · card · padding · text-align center).

- [ ] **Step 3: 실패 테스트**

`frontend/src/components/error/__tests__/error-content.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorContent } from "../error-content";

describe("ErrorContent", () => {
  it("renders 404 message + sleep mascot", () => {
    render(<ErrorContent code={404} />);
    expect(screen.getByText(/404/)).toBeInTheDocument();
    expect(screen.getByText(/이 페이지는 더 이상 찾을 수 없어요/)).toBeInTheDocument();
    const mascot = document.querySelector(".mascot-cloud.sleep");
    expect(mascot).not.toBeNull();
  });

  it("renders 500 message + think mascot", () => {
    render(<ErrorContent code={500} />);
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/잠시 후 다시 시도해주세요/)).toBeInTheDocument();
    const mascot = document.querySelector(".mascot-cloud.think");
    expect(mascot).not.toBeNull();
  });

  it("invokes reset on 500 다시 시도 click", () => {
    const reset = vi.fn();
    render(<ErrorContent code={500} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /다시 시도/ }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
```

Run: `cd frontend && npm run test -- error-content` → FAIL.

- [ ] **Step 4: ErrorContent 구현**

mock JSX (전체 41줄) 를 frontend 컴포넌트로 변환. mock 의 `Ico.Refresh` → 전역 `import { Refresh } from "@/components/ui/icons"`.

`frontend/src/components/error/error-content.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Refresh } from "@/components/ui/icons";
import { MascotCloud } from "@/components/ui/mascot-cloud";

type Props = {
  code?: 404 | 500;
  reset?: () => void;  // error.tsx 의 reset prop
};

export function ErrorContent({ code = 404, reset }: Props) {
  const router = useRouter();

  if (code === 500) {
    return (
      <div className="err-shell">
        <div className="err-card">
          <MascotCloud size="lg" expression="think" />
          <span className="code err">500 · 잠시 연결이 끊겼어요</span>
          <h2>잠시 후 다시 시도해주세요</h2>
          <p>서버 응답이 지연되고 있어요. 작성 중이던 자소서는 임시 저장되어 있어요.</p>
          <div className="actions">
            <button type="button" className="btn ghost sm">상태 페이지</button>
            <button
              type="button"
              className="btn primary sm"
              onClick={() => (reset ? reset() : window.location.reload())}
            >
              <Refresh size={12} /> 다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="err-shell">
      <div className="err-card">
        <MascotCloud size="lg" expression="sleep" />
        <span className="code">404 · NOT FOUND</span>
        <h2>이 페이지는 더 이상 찾을 수 없어요</h2>
        <p>주소가 바뀌었거나, 삭제됐을 수 있어요. 대시보드에서 다시 시작해보세요.</p>
        <div className="actions">
          <button type="button" className="btn ghost sm" onClick={() => router.back()}>뒤로</button>
          <Link href="/" className="btn primary sm">대시보드로</Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 169 tests passed (166 + 3 신규).

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/error/ frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(err): ErrorContent 컴포넌트 + kit.css port

mock: screen-error.jsx (41줄) 의 ErrorScreen conditional 패턴.

- error-content.tsx: code prop (404|500) 별 conditional render
- 404: mascot sleep + "이 페이지는 더 이상 찾을 수 없어요" + 뒤로 + 대시보드로
- 500: mascot think + "잠시 후 다시 시도해주세요" + 상태 페이지 + 다시 시도
  (reset prop 또는 window.location.reload 폴백)
- kit.css: .err-shell / .err-card / .code / .code.err port
- smoke test 3 (404 / 500 render · reset 호출)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: not-found + error 라우트 4개 (commit 2)

**Files:**
- Create: `frontend/src/app/(app)/not-found.tsx`
- Create: `frontend/src/app/(app)/error.tsx`
- Create: `frontend/src/app/(public)/not-found.tsx`
- Create: `frontend/src/app/(public)/error.tsx`

Next.js App Router:
- `not-found.tsx` — server component OK (auto-detected on 404)
- `error.tsx` — must be 'use client' + receives `{ error, reset }` props

- [ ] **Step 1: (app)/not-found.tsx**

`frontend/src/app/(app)/not-found.tsx`:

```tsx
import { ErrorContent } from "@/components/error/error-content";

export default function AppNotFound() {
  return <ErrorContent code={404} />;
}
```

- [ ] **Step 2: (app)/error.tsx**

```tsx
"use client";

import { useEffect } from "react";
import { ErrorContent } from "@/components/error/error-content";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("(app) error boundary:", error);
  }, [error]);
  return <ErrorContent code={500} reset={reset} />;
}
```

- [ ] **Step 3: (public)/not-found.tsx + (public)/error.tsx**

(app) 과 동일 패턴으로 2 파일 추가. component default export 만 다르고 내용 동일.

- [ ] **Step 4: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 169 tests passed (no change), build 통과 + Next.js 가 4 routes (`/_not-found`, `/_error` 등 표시 — 실제로는 fallback 패턴).

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/app/\(app\)/not-found.tsx \
        frontend/src/app/\(app\)/error.tsx \
        frontend/src/app/\(public\)/not-found.tsx \
        frontend/src/app/\(public\)/error.tsx
git commit -m "$(cat <<'EOF'
feat(err): not-found + error 라우트 4개 (app·public)

Next.js App Router not-found.tsx (auto-detected 404) + error.tsx
('use client' + reset prop) 패턴.

- (app)/not-found.tsx · (app)/error.tsx — 인증 영역 4xx/5xx
- (public)/not-found.tsx · (public)/error.tsx — 비인증 영역 4xx/5xx

error.tsx 는 useEffect 로 console.error 로깅. Sentry 통합은 별도 issue.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 최종 단계 — push + PR + CI + 머지

controller 수행:
- [ ] dev sanity (`/존재하지않는경로` → 404 / runtime error → 500)
- [ ] `git push -u origin feat/error-pages`
- [ ] `gh pr create --base develop --title "feat: error 404/500 화면 신규 (2단계 6번)"`
- [ ] CI watch + squash merge

## 완료 조건
- 2 commit
- 4 라우트 신규
- 169 tests passed (166 + 3 신규)
- PR 생성 + CI 통과
