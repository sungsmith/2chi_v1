# 2단계 PR 1번 (`feat/realign-dashboard`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `(app)/page.tsx` 의 dashboard 화면을 `design_system/project/ui_kits/web/screen-dashboard.jsx` mock 과 픽셀 단위로 재정렬. 데이터 바인딩·API·라우팅 로직 유지.

**Architecture:** mock JSX 의 마크업·className 을 frontend 컴포넌트에 그대로 옮김. mock 에 없는 `HomeBanner` 는 design_system banner 컴포넌트로 리디자인 유지. mock 의 `TodayQuote` 위치는 Greeting aside (memo-paper + tape + mascot wave) 로 통합. mock 의 `매칭 분석 패널` 은 UI-only 신규 추가 (BE 별도 issue). cluster-local `dashboard/icons.tsx` 와 `dashboard.css` 788줄은 제거. 7-commit 점진 분할.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 5 · Vitest 4 + RTL · ESLint 9. **주의**: [frontend/AGENTS.md](frontend/AGENTS.md) 가 "이 Next.js 는 breaking changes 있음. `node_modules/next/dist/docs/` 참조" 명시 — Next.js 16 의 redirect·error boundary 등 새 API 가 의심되면 docs 우선 확인.

**Spec:** `docs/superpowers/specs/2026-05-26-feat-realign-dashboard-design.md`

**Branch base:** `develop` (1단계 PR #15 머지됨, head `0b8500b`)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `frontend/src/styles/kit.css` | append | `.banner / .banner.info / .banner.warn / .banner.update` CSS ~40줄 추가 (`preview/banner.html` 의 inline style 기반) |
| `frontend/src/components/ui/banner.tsx` | create | design_system banner 컴포넌트. variant + dismissible + action |
| `frontend/src/components/ui/__tests__/banner.test.tsx` | create | render + variant + dismissible smoke test |
| `frontend/src/components/ui/mascot-cloud.tsx` | create | `<span className="mascot-cloud {size} {expression}"/>` 래퍼 |
| `frontend/src/components/ui/__tests__/mascot-cloud.test.tsx` | create | size·expression className 출력 smoke test |
| `frontend/src/lib/mock/dashboard.ts` | modify | `MATCH_RING_MOCK`, `GAPS_MOCK` 추가 |
| `frontend/src/components/dashboard/match-panel.tsx` | create | mock 의 `.panel` (.match-ring + .gap-list) |
| `frontend/src/components/dashboard/__tests__/match-panel.test.tsx` | create | render + 매칭률 % + GAPS 3건 |
| `frontend/src/components/dashboard/greeting.tsx` | modify | aside (memo-paper + tape + mascot wave) 통합 |
| `frontend/src/components/dashboard/today-quote.tsx` | **delete** | Greeting aside 로 통합됨 |
| `frontend/src/components/dashboard/dashboard-content.tsx` | modify (twice) | TodayQuote → MatchPanel 교체, 최종 정합 |
| `frontend/src/components/dashboard/kpi-completeness.tsx` | modify | `tone-mint` 클래스 적용 |
| `frontend/src/components/dashboard/kpi-cover-letters.tsx` | modify | 기본 tone, mini-stats 3행 정합 |
| `frontend/src/components/dashboard/kpi-in-progress.tsx` | modify | `tone-lav` 클래스 적용 |
| `frontend/src/components/dashboard/upcoming-panel.tsx` | modify | mock 의 `.sched-list` 마크업 그대로. `Ico.Calendar` |
| `frontend/src/components/dashboard/shortcuts.tsx` | modify | primary AI 1 + tone-1/2/3 3개 |
| `frontend/src/components/dashboard/icons.tsx` | **delete** | 전역 `components/ui/icons.tsx` 로 대체 |
| `frontend/src/components/home/home-banner.tsx` | modify | inline style → `<Banner variant="info">` |
| `frontend/src/app/(app)/page.tsx` | modify | `import "./dashboard.css"` 제거 |
| `frontend/src/app/(app)/dashboard.css` | **delete** | 788줄 → 0 |
| `frontend/src/components/dashboard/__tests__/dashboard-content.test.tsx` | modify | 마크업 변경 따라 셀렉터 갱신 |
| `frontend/src/components/dashboard/__tests__/greeting.test.tsx` | modify | aside 통합 따라 갱신 |
| `frontend/src/components/dashboard/__tests__/upcoming-panel.test.tsx` | modify | 마크업 변경 따라 갱신 |

---

## Task 1: 브랜치 생성 + `Banner` + `MascotCloud` 컴포넌트 (commit 1)

**Files:**
- Append: `frontend/src/styles/kit.css` (~40 lines)
- Create: `frontend/src/components/ui/banner.tsx`, `__tests__/banner.test.tsx`
- Create: `frontend/src/components/ui/mascot-cloud.tsx`, `__tests__/mascot-cloud.test.tsx`

- [ ] **Step 1: develop 동기화 + 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop && git pull origin develop
git checkout -b feat/realign-dashboard
git branch --show-current  # feat/realign-dashboard
```

- [ ] **Step 2: kit.css 에 `.banner` CSS append**

`frontend/src/styles/kit.css` 끝에 다음 블록 추가 (source: `design_system/project/preview/banner.html` 의 `<style>` 인라인):

```css
/* ============================================================
   Banner (info · warn · update) — 본 가이드는 preview/banner.html 기반
============================================================ */
.banner {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px 10px 16px;
  background: #fff;
  border: 1px solid var(--color-border-default);
  border-left: 3px solid var(--color-neutral-300);
  border-radius: 10px;
  font-size: 12.5px; line-height: 1.5; color: var(--color-text-primary);
}
.banner .ico {
  width: 18px; height: 18px; flex: 0 0 auto;
  color: var(--color-text-muted); display: inline-flex; align-items: center;
}
.banner .body { flex: 1; min-width: 0; }
.banner .body b { font-weight: 700; }
.banner .action {
  background: transparent; border: 1px solid var(--color-border-default);
  padding: 5px 10px; border-radius: 6px;
  font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
  color: var(--color-text-primary);
}
.banner .action:hover { background: var(--color-surface-soft); border-color: var(--color-border-strong); }
.banner .x {
  background: none; border: none; cursor: pointer; opacity: 0.55;
  width: 26px; height: 26px; display: grid; place-items: center;
  color: var(--color-text-muted); border-radius: 6px;
}
.banner .x:hover { opacity: 1; background: var(--color-surface-soft); }

.banner.info   { border-left-color: var(--color-primary-500); }
.banner.info   .ico { color: var(--color-primary-600); }
.banner.warn   { border-left-color: var(--color-yellow-400); }
.banner.warn   .ico { color: var(--color-yellow-400); }
.banner.update { border-left-color: var(--color-lavender-500); }
.banner.update .ico { color: var(--color-lavender-600); }
```

Verify:
```bash
grep -c "^\.banner" frontend/src/styles/kit.css   # 4
```

- [ ] **Step 3: `mascot-cloud.tsx` 실패 테스트 작성**

`frontend/src/components/ui/__tests__/mascot-cloud.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MascotCloud } from "../mascot-cloud";

describe("MascotCloud", () => {
  it("renders span with mascot-cloud class + size + expression", () => {
    const { container } = render(<MascotCloud size="md" expression="wave" />);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.className).toBe("mascot-cloud md wave");
    expect(span?.getAttribute("aria-hidden")).toBe("true");
  });

  it("defaults size=md expression=default", () => {
    const { container } = render(<MascotCloud />);
    expect(container.querySelector("span")?.className).toBe("mascot-cloud md default");
  });
});
```

Run: `cd frontend && npm run test -- mascot-cloud.test` → FAIL ("Cannot find module '../mascot-cloud'")

- [ ] **Step 4: `mascot-cloud.tsx` 구현**

`frontend/src/components/ui/mascot-cloud.tsx`:

```tsx
type Size = "sm" | "md" | "lg" | "xl";
type Expression = "default" | "wave" | "happy" | "think" | "excited" | "sleep";

type Props = {
  size?: Size;
  expression?: Expression;
};

export function MascotCloud({ size = "md", expression = "default" }: Props) {
  return <span className={`mascot-cloud ${size} ${expression}`} aria-hidden="true" />;
}
```

Run: `cd frontend && npm run test -- mascot-cloud.test` → 2 passed.

- [ ] **Step 5: `banner.tsx` 실패 테스트 작성**

`frontend/src/components/ui/__tests__/banner.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Banner } from "../banner";

describe("Banner", () => {
  it("renders with default variant=info", () => {
    const { container } = render(<Banner>안내 메시지</Banner>);
    const root = container.querySelector(".banner");
    expect(root?.className).toContain("info");
  });

  it("renders variant=warn / variant=update", () => {
    const { container, rerender } = render(<Banner variant="warn">경고</Banner>);
    expect(container.querySelector(".banner")?.className).toContain("warn");
    rerender(<Banner variant="update">업데이트</Banner>);
    expect(container.querySelector(".banner")?.className).toContain("update");
  });

  it("shows action button + invokes onAction", () => {
    const onAction = vi.fn();
    render(<Banner actionLabel="자세히" onAction={onAction}>본문</Banner>);
    fireEvent.click(screen.getByText("자세히"));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("shows dismiss button + invokes onDismiss", () => {
    const onDismiss = vi.fn();
    render(<Banner dismissible onDismiss={onDismiss}>본문</Banner>);
    fireEvent.click(screen.getByLabelText("닫기"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
```

Run: `cd frontend && npm run test -- banner.test` → FAIL ("Cannot find module '../banner'")

- [ ] **Step 6: `banner.tsx` 구현**

`frontend/src/components/ui/banner.tsx`:

```tsx
"use client";

import { ReactNode } from "react";

type Variant = "info" | "warn" | "update";

type Props = {
  variant?: Variant;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
};

const VariantIcon = ({ variant }: { variant: Variant }) => {
  if (variant === "warn") {
    return (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (variant === "update") {
    return (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
};

export function Banner({
  variant = "info",
  children,
  actionLabel,
  onAction,
  dismissible,
  onDismiss,
}: Props) {
  return (
    <div className={`banner ${variant}`} role="status">
      <span className="ico">
        <VariantIcon variant={variant} />
      </span>
      <span className="body">{children}</span>
      {actionLabel && (
        <button type="button" className="action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {dismissible && (
        <button type="button" className="x" aria-label="닫기" onClick={onDismiss}>
          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
```

Run: `cd frontend && npm run test -- banner.test` → 4 passed.

- [ ] **Step 7: 전체 lint + test + build**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: lint 0 errors · 128 tests passed (122 + 6 신규) · Compiled successfully.

- [ ] **Step 8: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/styles/kit.css \
        frontend/src/components/ui/banner.tsx \
        frontend/src/components/ui/__tests__/banner.test.tsx \
        frontend/src/components/ui/mascot-cloud.tsx \
        frontend/src/components/ui/__tests__/mascot-cloud.test.tsx
git commit -m "$(cat <<'EOF'
feat(ui): banner + mascot-cloud 컴포넌트 + kit.css banner CSS

- ui/banner.tsx: variant (info·warn·update) + actionLabel + dismissible.
  preview/banner.html 의 inline style 을 kit.css 의 .banner / .banner.{variant}
  CSS 40줄로 통합.
- ui/mascot-cloud.tsx: <span className="mascot-cloud {size} {expression}"/>
  래퍼. PNG 6 표현 (default·wave·happy·think·excited·sleep) 매핑.
- smoke test 6개 (banner 4 + mascot-cloud 2).

2단계 화면 PR 에서 첫 사용될 공용 컴포넌트 — 1단계 spec 의 "공용 컴포넌트는
화면 PR 에서 첫 사용 시 정의" 정책 적용. dashboard PR 후속 commit 에서 사용.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `MatchPanel` + mock 데이터 (commit 2)

**Files:**
- Modify: `frontend/src/lib/mock/dashboard.ts`
- Create: `frontend/src/components/dashboard/match-panel.tsx`
- Create: `frontend/src/components/dashboard/__tests__/match-panel.test.tsx`

mock JSX: [screen-dashboard.jsx:117-148](design_system/project/ui_kits/web/screen-dashboard.jsx) 의 `<section className="panel">` (매칭 분석) 부분.

- [ ] **Step 1: mock 데이터 형태 확인**

```bash
sed -n '12,17p' design_system/project/ui_kits/web/screen-dashboard.jsx
```

Expected: `GAPS` 배열 3건 (`{ nm, sub, hit }`). 그리고 match-ring 은 percentage 1개 (mock 에 68 하드코딩) + 메타 (희망 포지션·JD 평균 매칭률·서브 설명).

- [ ] **Step 2: `frontend/src/lib/mock/dashboard.ts` 에 mock 데이터 추가**

기존 파일을 읽어 형식 확인 후 끝에 다음 추가:

```ts
export type MatchRing = {
  percent: number;
  position: string;
  metricLabel: string;
  description: string;
};

export type Gap = {
  name: string;
  sub: string;
  hit: string;
};

export const MATCH_RING_MOCK: MatchRing = {
  percent: 68,
  position: "희망 포지션 · 백엔드",
  metricLabel: "JD 평균 매칭률",
  description: "최근 등록한 채용공고 8건을 기준으로, 이력과 키워드 매칭을 비교했어요.",
};

export const GAPS_MOCK: Gap[] = [
  { name: "Kafka / MSA 운영 경험",        sub: "결제·정산 도메인 공고에서 자주 언급",   hit: "5건" },
  { name: "대용량 트래픽 처리 (TPS 5K+)", sub: "관련 프로젝트 정량 결과 보완 추천",     hit: "4건" },
  { name: "관측성(Observability) 도구",   sub: "Datadog · Grafana · OpenTelemetry",     hit: "3건" },
];
```

- [ ] **Step 3: 실패 테스트 작성**

`frontend/src/components/dashboard/__tests__/match-panel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MatchPanel } from "../match-panel";
import { MATCH_RING_MOCK, GAPS_MOCK } from "@/lib/mock/dashboard";

describe("MatchPanel", () => {
  it("renders match ring percentage", () => {
    render(<MatchPanel ring={MATCH_RING_MOCK} gaps={GAPS_MOCK} />);
    expect(screen.getByText("68%")).toBeInTheDocument();
    expect(screen.getByText("매칭률")).toBeInTheDocument();
  });

  it("renders ring meta — position + label + description", () => {
    render(<MatchPanel ring={MATCH_RING_MOCK} gaps={GAPS_MOCK} />);
    expect(screen.getByText("희망 포지션 · 백엔드")).toBeInTheDocument();
    expect(screen.getByText("JD 평균 매칭률")).toBeInTheDocument();
    expect(screen.getByText(/최근 등록한 채용공고 8건/)).toBeInTheDocument();
  });

  it("renders all 3 gaps with name + sub + hit", () => {
    render(<MatchPanel ring={MATCH_RING_MOCK} gaps={GAPS_MOCK} />);
    expect(screen.getByText("Kafka / MSA 운영 경험")).toBeInTheDocument();
    expect(screen.getByText("결제·정산 도메인 공고에서 자주 언급")).toBeInTheDocument();
    expect(screen.getByText("+5건")).toBeInTheDocument();
    expect(screen.getByText("+4건")).toBeInTheDocument();
    expect(screen.getByText("+3건")).toBeInTheDocument();
  });
});
```

Run: `cd frontend && npm run test -- match-panel.test` → FAIL.

- [ ] **Step 4: `match-panel.tsx` 구현**

mock JSX [screen-dashboard.jsx:117-148](design_system/project/ui_kits/web/screen-dashboard.jsx) 의 마크업 그대로 옮김. `Ico.Target` / `Ico.ArrowRight` 는 전역 `components/ui/icons.tsx` 에서 import.

`frontend/src/components/dashboard/match-panel.tsx`:

```tsx
"use client";

import { Target, ArrowRight } from "@/components/ui/icons";
import type { MatchRing, Gap } from "@/lib/mock/dashboard";

type Props = {
  ring: MatchRing;
  gaps: Gap[];
};

export function MatchPanel({ ring, gaps }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="title lav">
          <span className="ico">
            <Target size={16} />
          </span>
          매칭 분석
        </h2>
        <a className="more" href="#">
          자세히 <ArrowRight />
        </a>
      </div>
      <div className="match-top">
        <div className="match-ring" style={{ ["--p" as string]: ring.percent } as React.CSSProperties}>
          <span>
            <span className="v">{ring.percent}%</span>
            <span className="lbl">매칭률</span>
          </span>
        </div>
        <div className="meta">
          <span className="k">{ring.position}</span>
          <span className="t">{ring.metricLabel}</span>
          <span className="sub">{ring.description}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="badge lav dot">부족 역량 TOP 3</span>
      </div>
      <div className="gap-list">
        {gaps.map((g, i) => (
          <div key={i} className="gap-item">
            <span className="rank">{i + 1}</span>
            <div>
              <span className="nm">{g.name}</span>
              <span className="sub">{g.sub}</span>
            </div>
            <span className="hit">+{g.hit}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Run: `cd frontend && npm run test -- match-panel.test` → 3 passed.

- [ ] **Step 5: 전체 lint + test + build**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 131 tests passed (128 + 3 신규) · Compiled successfully.

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/lib/mock/dashboard.ts \
        frontend/src/components/dashboard/match-panel.tsx \
        frontend/src/components/dashboard/__tests__/match-panel.test.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): MatchPanel + mock 데이터 (UI-only, BE 별도)

mock: design_system/project/ui_kits/web/screen-dashboard.jsx
(.panel 의 매칭 분석 — match-ring conic-gradient 도넛 + 부족 역량 TOP 3).

- mock/dashboard.ts: MatchRing·Gap 타입 + MATCH_RING_MOCK (68%·메타)
  + GAPS_MOCK (3건, mock JSX 의 GAPS 그대로) 추가
- components/dashboard/match-panel.tsx: 마크업 mock 그대로 + Ico.Target /
  Ico.ArrowRight 전역 카탈로그 사용
- test 3건: ring % / 메타 / GAPS 3건 표시

UI mock-only — BE matching analysis endpoint 는 별도 issue 로 spawn 예정
(spec §6 Out of scope).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `Greeting` aside 통합 + `TodayQuote` 제거 (commit 3)

**Files:**
- Modify: `frontend/src/components/dashboard/greeting.tsx`
- **Delete**: `frontend/src/components/dashboard/today-quote.tsx`
- Modify: `frontend/src/components/dashboard/dashboard-content.tsx` (부분 — TodayQuote import 제거 + dual-grid 의 TodayQuote 자리 비움)

mock JSX [screen-dashboard.jsx:23-47](design_system/project/ui_kits/web/screen-dashboard.jsx) 의 `<section className="greet">` 그대로. aside 는 `memo-paper` 클래스 + `tape mint` style + "오늘의 한 줄" 마크업.

- [ ] **Step 1: greeting 테스트 갱신 (TDD: aside 검증 추가)**

`frontend/src/components/dashboard/__tests__/greeting.test.tsx` 를 읽고 aside 마크업 검증 케이스 추가:

```tsx
// 기존 테스트 유지 + 다음 추가
import { MascotCloud } from "@/components/ui/mascot-cloud";

it("renders memo-paper aside with mascot wave + 오늘의 한 줄", () => {
  render(<Greeting nickname="소미" showTags={true} todayQuote="이번 주는 1차 면접 두 곳,\n차근히 준비해봐요." />);
  const aside = document.querySelector("aside.greet-aside.memo-paper");
  expect(aside).not.toBeNull();
  expect(aside?.querySelector(".tape.mint")).not.toBeNull();
  expect(aside?.querySelector(".mascot-cloud.wave, .mascot-cloud.md.wave")).not.toBeNull();
  expect(aside?.textContent).toContain("오늘의 한 줄");
});
```

(주의: 기존 `Greeting` 의 props 는 `{ nickname, showTags }`. todayQuote prop 신규 추가 필요.)

Run: `cd frontend && npm run test -- greeting.test` → 신규 케이스 FAIL.

- [ ] **Step 2: `greeting.tsx` 갱신**

`frontend/src/components/dashboard/greeting.tsx`:

```tsx
"use client";

import { MascotCloud } from "@/components/ui/mascot-cloud";
import { GREETING_TAGS } from "@/lib/mock/dashboard";

type Props = {
  nickname: string;
  showTags: boolean;
  todayQuote?: string;
};

function formatGreetingDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  return `${year} · ${month} · ${day} ${weekday} · 오늘의 준비 현황`;
}

export function Greeting({ nickname, showTags, todayQuote }: Props) {
  const dateLabel = formatGreetingDate(new Date());

  return (
    <section className="greet">
      <div className="greet-text">
        <div className="greet-meta" suppressHydrationWarning>
          {dateLabel}
        </div>
        <h1>
          안녕하세요, {nickname}님
          <span className="wave" role="img" aria-label="hi">
            👋
          </span>
        </h1>
        <p className="line2">
          오늘도 이취가 다가오는 일정과 작성 흐름을 같이 정리해드릴게요. 내 이력과 지원 현황을 기준으로, 이번 주에 챙기면 좋을 준비를 모아뒀어요.
        </p>
        {showTags && (
          <div className="greet-tags">
            {GREETING_TAGS.map((t) => (
              <span key={t.label} className={`greet-tag${t.tone ? ` ${t.tone}` : ""}`}>
                <span className="swatch" />
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {todayQuote && (
        <aside className="greet-aside memo-paper">
          <span
            className="tape mint"
            style={{ top: "-10px", left: "50%", transform: "translateX(-50%) rotate(-4deg)" }}
          />
          <MascotCloud size="md" expression="wave" />
          <small>오늘의 한 줄</small>
          <div className="memo-copy">
            {todayQuote.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </div>
        </aside>
      )}
    </section>
  );
}
```

Run: `cd frontend && npm run test -- greeting.test` → all passed.

- [ ] **Step 3: TodayQuote 제거 + dashboard-content 부분 갱신**

```bash
rm frontend/src/components/dashboard/today-quote.tsx
```

`frontend/src/components/dashboard/dashboard-content.tsx` 를 수정:
- `import { TodayQuote }` 제거
- `<Greeting>` 에 `todayQuote` prop 전달 — 기본값은 mock 또는 상수 (mock 의 "이번 주는 1차 면접 두 곳,\n차근히 준비해봐요." 그대로)
- dual-grid 의 `<TodayQuote />` 제거 → 자리에 (Task 4에서 채워질) placeholder 또는 빈 상태

이 commit 에서는 dual-grid 가 (UpcomingPanel · empty) 상태가 되므로 임시로 dual-grid 를 1열 grid 로:

```tsx
"use client";

import { useAuth } from "@/contexts/auth-context";
import { HomeBanner } from "@/components/home/home-banner";
import { Greeting } from "./greeting";
import { KpiCompleteness } from "./kpi-completeness";
import { KpiCoverLetters } from "./kpi-cover-letters";
import { KpiInProgress } from "./kpi-in-progress";
import { UpcomingPanel } from "./upcoming-panel";
import { Shortcuts } from "./shortcuts";
import {
  KPI_COMPLETENESS_MOCK,
  KPI_COVER_LETTERS_MOCK,
  KPI_IN_PROGRESS_MOCK,
  TODAY_QUOTE_MOCK,
} from "@/lib/mock/dashboard";

export function DashboardContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="dash-main">
      <HomeBanner />
      <Greeting
        nickname={user.nickname}
        showTags={user.onboardingCompleted}
        todayQuote={TODAY_QUOTE_MOCK}
      />
      <div className="kpi-grid">
        <KpiCompleteness data={KPI_COMPLETENESS_MOCK} />
        <KpiCoverLetters data={KPI_COVER_LETTERS_MOCK} />
        <KpiInProgress data={KPI_IN_PROGRESS_MOCK} />
      </div>
      <div className="dual-grid">
        <UpcomingPanel />
      </div>
      <Shortcuts />
    </div>
  );
}
```

`frontend/src/lib/mock/dashboard.ts` 에 `TODAY_QUOTE_MOCK` 추가:

```ts
export const TODAY_QUOTE_MOCK = "이번 주는 1차 면접 두 곳,\n차근히 준비해봐요.";
```

- [ ] **Step 4: dashboard-content 통합 테스트 임시 갱신**

기존 `dashboard-content.test.tsx` 가 `<TodayQuote />` 의 텍스트를 검증하면 그 부분만 임시 비활성 (`it.skip` 또는 mock 검증으로 변경). 최종 갱신은 Task 7. 이 commit 에서는 build/test 통과만 보장.

```bash
cd frontend && npm run test
```

Expected: 모든 테스트 통과 (today-quote 관련 ` it.skip`).

- [ ] **Step 5: lint + build**

```bash
cd frontend && npm run lint && npm run build
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/dashboard/greeting.tsx \
        frontend/src/components/dashboard/dashboard-content.tsx \
        frontend/src/components/dashboard/__tests__/greeting.test.tsx \
        frontend/src/components/dashboard/__tests__/dashboard-content.test.tsx \
        frontend/src/lib/mock/dashboard.ts
git rm frontend/src/components/dashboard/today-quote.tsx
git commit -m "$(cat <<'EOF'
refactor(dashboard): Greeting 에 aside 통합 + TodayQuote 제거

mock 의 .greet section 마크업 그대로: main 텍스트 + tags + aside (memo-paper
+ mint tape + MascotCloud wave + 오늘의 한 줄 memo).

- Greeting: todayQuote prop 추가, aside 마크업 통합. 마스코트 wave 도입.
- TodayQuote 컴포넌트 제거 — Greeting aside 로 통합됨.
- dashboard-content: TodayQuote import 제거, dual-grid 임시 1열 (Task 2 commit
  의 MatchPanel 은 다음 commit 에서 dual-grid 에 도입).
- mock/dashboard.ts: TODAY_QUOTE_MOCK 상수 추가.
- 통합 테스트 일부 it.skip — Task 7 에서 일괄 갱신.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: KPI 3장 + Shortcuts + UpcomingPanel mock 정렬 + cluster-local icons 제거 (commit 4)

**Files:**
- Modify: `frontend/src/components/dashboard/kpi-completeness.tsx` (`tone-mint`)
- Modify: `frontend/src/components/dashboard/kpi-cover-letters.tsx` (기본 tone, mini-stats 정합)
- Modify: `frontend/src/components/dashboard/kpi-in-progress.tsx` (`tone-lav`)
- Modify: `frontend/src/components/dashboard/upcoming-panel.tsx` (sched-list 정합)
- Modify: `frontend/src/components/dashboard/shortcuts.tsx` (primary + tone-1/2/3)
- Modify: `frontend/src/components/dashboard/dashboard-content.tsx` (dual-grid 에 MatchPanel 추가)
- **Delete**: `frontend/src/components/dashboard/icons.tsx`

mock JSX 절들:
- KPI: [screen-dashboard.jsx:50-85](design_system/project/ui_kits/web/screen-dashboard.jsx)
- UpcomingPanel: [screen-dashboard.jsx:89-115](design_system/project/ui_kits/web/screen-dashboard.jsx)
- Shortcuts: [screen-dashboard.jsx:151-174](design_system/project/ui_kits/web/screen-dashboard.jsx)

변환 패턴:
- `Ico.LayersFooXX size={16}` → `import { Layers } from '@/components/ui/icons'; <Layers size={16} />`
- mock 의 hardcoded 데이터 ↔ frontend 의 mock JSON props — 데이터 형태 유지하되 마크업만 mock 그대로

- [ ] **Step 1: KPI 3장 정합**

각 파일을 mock 의 해당 `<article className="kpi {tone}">` 마크업으로 정합. mock 데이터 prop 구조는 기존 `KPI_*_MOCK` 그대로 유지하되 키 이름이 mock JSX 의 표시와 다를 경우 mock JSX 표시 따라감.

`kpi-completeness.tsx` — `tone-mint` 클래스 추가, bar-row 3행 (이력서·경력기술·포트폴리오):

mock 마크업 [screen-dashboard.jsx:51-59](design_system/project/ui_kits/web/screen-dashboard.jsx) 참조. `<Ico.Layers size={16}/>` → `<Layers size={16}/>` (전역 import). 기존 data prop 의 percent/bars 구조 그대로 사용.

`kpi-in-progress.tsx` — `tone-lav` 클래스 추가, stage-row 4 chip ([screen-dashboard.jsx:73-84](design_system/project/ui_kits/web/screen-dashboard.jsx)).

`kpi-cover-letters.tsx` — 기본 tone (클래스 추가 없음), mini-stats 3행 [screen-dashboard.jsx:62-71](design_system/project/ui_kits/web/screen-dashboard.jsx).

각 파일 수정 후 해당 단위 테스트 통과 확인:
```bash
cd frontend && npm run test -- kpi-
```

- [ ] **Step 2: UpcomingPanel 정합**

mock 마크업 [screen-dashboard.jsx:89-115](design_system/project/ui_kits/web/screen-dashboard.jsx) 그대로. 기존 컴포넌트가 mock 의 데이터 형태와 어떻게 다른지 확인 후 정합.

```bash
cd frontend && npm run test -- upcoming-panel.test
```

- [ ] **Step 3: Shortcuts 정합**

mock 마크업 [screen-dashboard.jsx:151-174](design_system/project/ui_kits/web/screen-dashboard.jsx). primary + tone-1/2/3 4개. `Ico.Sparkle / Plus / Building / Calendar` 전역 import.

- [ ] **Step 4: cluster-local icons.tsx 삭제**

```bash
git rm frontend/src/components/dashboard/icons.tsx
```

위 KPI/UpcomingPanel/Shortcuts 수정 시 모든 `Ico.X` 사용처를 `import { X } from "@/components/ui/icons"` 로 교체 완료했는지 verify:

```bash
grep -rn "from \"./icons\"" frontend/src/components/dashboard/
```

Expected: 결과 없음. 있으면 그 파일에서 import 경로 교체.

- [ ] **Step 5: dashboard-content 에 MatchPanel 추가**

`frontend/src/components/dashboard/dashboard-content.tsx` 의 dual-grid 를 (UpcomingPanel · MatchPanel) 로:

```tsx
import { MatchPanel } from "./match-panel";
import { MATCH_RING_MOCK, GAPS_MOCK } from "@/lib/mock/dashboard";
// ...
<div className="dual-grid">
  <UpcomingPanel />
  <MatchPanel ring={MATCH_RING_MOCK} gaps={GAPS_MOCK} />
</div>
```

- [ ] **Step 6: lint + test + build**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 빌드/lint 통과. 테스트는 마크업 변경 따라 셀렉터 갱신 필요할 수 있음 (it.skip 또는 임시 갱신). 최종은 Task 7.

- [ ] **Step 7: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/dashboard/
git status --short  # KPI 3 + UpcomingPanel + Shortcuts + dashboard-content + icons.tsx deletion
git commit -m "$(cat <<'EOF'
refactor(dashboard): KPI/Shortcuts/UpcomingPanel mock 정렬 + 전역 Ico 사용

mock: design_system/project/ui_kits/web/screen-dashboard.jsx 의
.kpi-grid / .sched-list / .shortcuts 마크업 그대로.

- KpiCompleteness: tone-mint + bar-row 3행 (이력서·경력기술·포트폴리오)
- KpiCoverLetters: 기본 tone + mini-stats 3행 (이번 달·마스터·변형본)
- KpiInProgress: tone-lav + stage-row 4 chip (서류·코테·1차면접·2차면접)
- UpcomingPanel: sched-list 마크업 mock 그대로
- Shortcuts: primary 1 + tone-1/2/3 3개, Ico.Sparkle/Plus/Building/Calendar
- dashboard-content: dual-grid 에 MatchPanel 추가 (UpcomingPanel · MatchPanel)
- cluster-local dashboard/icons.tsx 삭제 → 전역 components/ui/icons.tsx 사용

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `HomeBanner` → `Banner` 컴포넌트 (commit 5)

**Files:**
- Modify: `frontend/src/components/home/home-banner.tsx`

inline style 제거, `<Banner variant="info">` 사용. onboarding 미완료 조건 유지.

- [ ] **Step 1: home-banner.tsx 교체**

```tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Banner } from "@/components/ui/banner";

export function HomeBanner() {
  const { user, initialized } = useAuth();
  if (!initialized || !user || user.onboardingCompleted) return null;

  return (
    <Banner variant="info">
      온보딩을 완료하면 맞춤 분석이 시작돼요.{" "}
      <Link href="/onboarding" style={{ color: "var(--color-text-brand)", textDecoration: "underline" }}>
        지금 완료하기
      </Link>
    </Banner>
  );
}
```

- [ ] **Step 2: lint + test + build**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/home/home-banner.tsx
git commit -m "$(cat <<'EOF'
refactor(home): HomeBanner → Banner 컴포넌트

inline style 을 ui/banner.tsx 의 variant="info" 로 교체. onboarding 미완료
사용자에게만 표시되는 조건은 유지.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `dashboard.css` 삭제 + `page.tsx` 정리 (commit 6)

**Files:**
- Modify: `frontend/src/app/(app)/page.tsx`
- **Delete**: `frontend/src/app/(app)/dashboard.css`

dashboard.css 788줄이 kit.css 의 클래스로 모두 cover 되는지 확인 후 삭제. 미커버되는 selector 발견 시 kit.css 에 patch.

- [ ] **Step 1: dashboard.css 의 selector 목록 추출**

```bash
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" frontend/src/app/\(app\)/dashboard.css | sort -u > /tmp/dash_selectors.txt
wc -l /tmp/dash_selectors.txt
```

- [ ] **Step 2: kit.css 와 cross-check**

```bash
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" frontend/src/styles/kit.css | sort -u > /tmp/kit_selectors.txt
comm -23 /tmp/dash_selectors.txt /tmp/kit_selectors.txt
```

Expected: kit.css 에 없는 selector 목록 출력. 만약 출력이 있으면 그 selector 들이 실제로 dashboard 에서 쓰이는지 확인 후, 쓰이면 kit.css 에 patch.

- [ ] **Step 3: dev 서버로 시각 sanity (controller 가 수행 — implementer 는 자동 검증만)**

implementer 는 다음만 수행:

```bash
cd frontend && npm run dev &
SERVER_PID=$!
sleep 5
curl -sI http://localhost:3000/ | head -1
kill $SERVER_PID
```

Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 4: page.tsx 에서 dashboard.css import 제거**

`frontend/src/app/(app)/page.tsx`:

```tsx
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardPage() {
  return (
    <section className="dash-page">
      <DashboardContent />
    </section>
  );
}
```

- [ ] **Step 5: dashboard.css 삭제**

```bash
git rm frontend/src/app/\(app\)/dashboard.css
```

- [ ] **Step 6: 빌드 + lint + test 통과**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 통과. 화면 회귀는 controller 의 수동 sanity 로 확인.

- [ ] **Step 7: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/app/\(app\)/page.tsx frontend/src/styles/kit.css 2>/dev/null
git status --short  # page.tsx + dashboard.css deletion (+ kit.css 추가가 있으면 함께)
git commit -m "$(cat <<'EOF'
chore(fe): dashboard.css 삭제 + page.tsx 의 import 제거

788줄 dashboard.css 의 모든 selector 가 kit.css 의 클래스로 cover 됨을
확인 후 삭제. dashboard 화면의 모든 시각 정의는 design_system 본의 kit.css
한 곳으로 통합.

(필요 시 kit.css 에 미커버 selector patch 포함.)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: 통합 테스트 갱신 (commit 7)

**Files:**
- Modify: `frontend/src/components/dashboard/__tests__/dashboard-content.test.tsx`
- Modify: `frontend/src/components/dashboard/__tests__/greeting.test.tsx`
- Modify: `frontend/src/components/dashboard/__tests__/upcoming-panel.test.tsx`

Task 3, Task 4 에서 임시 `it.skip` 또는 mock 셀렉터 갱신했던 부분을 모두 최종 마크업에 맞춰 정합. mock JSX 의 className 기반 셀렉터로 통일.

- [ ] **Step 1: 모든 skip 된 테스트 식별**

```bash
cd frontend && grep -rn "it.skip\|test.skip" src/components/dashboard/__tests__/
```

Expected: Task 3/4 에서 추가된 skip 들.

- [ ] **Step 2: 각 테스트 케이스를 새 마크업에 맞춰 갱신**

각 파일을 열고:
- `it.skip` → `it` 으로 변경
- mock 셀렉터를 새 마크업 (className 기반) 으로 갱신
- mock 의 hardcoded 텍스트 ("오늘의 한 줄", "다가오는 일정" 등) 와 일치

(구체 코드는 implementer 가 mock JSX 와 frontend 실제 마크업을 보고 결정.)

- [ ] **Step 3: 전체 테스트 + lint + build**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: 모든 테스트 PASS. skip 0건.

```bash
grep -rn "skip" src/components/dashboard/__tests__/
```

Expected: 결과 없음.

- [ ] **Step 4: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/dashboard/__tests__/
git commit -m "$(cat <<'EOF'
test(dashboard): 통합 테스트 갱신 — mock 정렬 마크업에 맞춤

Task 3, Task 4 에서 임시 it.skip 처리했던 케이스들을 모두 최종 마크업에 맞춰
정합. className 기반 셀렉터 + mock JSX 의 카피 텍스트 사용.

대상:
- dashboard-content.test (TodayQuote 제거 + MatchPanel 추가 반영)
- greeting.test (aside · memo-paper · MascotCloud wave 검증)
- upcoming-panel.test (sched-list 마크업 변경 반영)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 최종 단계 — push + PR 생성

Plan 의 7 commit 모두 완료 후 controller 가 수행 (implementer 가 아님):

- [ ] develop 동기화 + rebase (필요 시)
- [ ] dev 서버로 9 화면 sanity check — 특히 dashboard 시각 (mock 과 직접 비교)
- [ ] `git push -u origin feat/realign-dashboard`
- [ ] `gh pr create --base develop --title "feat: realign dashboard — design_system mock 픽셀 재현 (2단계 1번)" --body "..."`

PR description 템플릿: 1단계 PR (#15) 패턴 따라 Summary / Notes / Test plan / 후속 작업.

---

## 완료 조건 (Done definition)

- 7 task 모두 commit
- 각 commit 단위 build/lint/test 통과 (중간 빌드 깨짐 없음)
- 최종 테스트 skip 0건
- 신규 ui 컴포넌트 2개 (Banner, MascotCloud) + 신규 dashboard 컴포넌트 1개 (MatchPanel) + 신규 test 9개
- dashboard.css 788줄 → 0 (kit.css 로 완전 대체)
- cluster-local dashboard/icons.tsx 제거
- mock JSX 와 frontend dashboard 의 마크업 className 100% 일치
- PR 생성 + Frontend CI · Backend CI 통과
