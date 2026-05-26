# 2단계 PR 5번 (`feat/realign-applications`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/applications` cluster (캘린더 4 view / 칸반 / 히스토리) 화면을 mock 과 픽셀 단위로 재정렬. table → 칸반 IA 전환 + calendar 4 sub-view 신규 + history 신규.

**Architecture:** mock JSX 마크업·className 그대로. 9-commit 점진 분할 (각 commit 빌드 통과 보장). 큰 mock 컴포넌트 (CalendarMonth/Year/Week/Day 40-65줄 · KanbanView 70줄 · HistoryView 100줄) 는 mock line range reference + 변환 패턴. 작은 자산 (ap-side-nav · mock 데이터 · smoke test) 은 전체 코드.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 5 · Vitest 4 + RTL · ESLint 9. AGENTS.md 의 Next.js breaking changes 주의.

**Spec:** `docs/superpowers/specs/2026-05-26-feat-realign-applications-design.md`

**Branch base:** `develop` (#20 머지됨, head `0eb91e1`)

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `frontend/src/app/(app)/applications/layout.tsx` | create or modify | cluster shell + ap-side-nav |
| `frontend/src/app/(app)/applications/page.tsx` | modify | applications-content (table) → kanban-view |
| `frontend/src/app/(app)/applications/calendar/page.tsx` | modify | calendar-content + 4-view 토글 |
| `frontend/src/app/(app)/applications/history/page.tsx` | create | history-view 렌더 |
| `frontend/src/components/applications/ap-side-nav.tsx` | create | mock ApSideNav 3-item |
| `frontend/src/components/applications/kanban-view.tsx` | create | mock KanbanView (line 423-491) |
| `frontend/src/components/applications/calendar-year.tsx` | create | mock CalendarYear (line 231-280) |
| `frontend/src/components/applications/calendar-week.tsx` | create | mock CalendarWeek (line 281-334) |
| `frontend/src/components/applications/calendar-day.tsx` | create | mock CalendarDay (line 335-401) |
| `frontend/src/components/applications/history-view.tsx` | create | mock HistoryView (line 505-604) |
| `frontend/src/components/applications/history-row.tsx` | create | mock HistoryRow (line 492-503) |
| `frontend/src/components/applications/calendar-content.tsx` | modify | view 토글 셸 + sub-view 선택 |
| `frontend/src/components/applications/calendar-grid.tsx` | rename + modify | calendar-month.tsx — mock CalendarMonth (line 190-230) |
| `frontend/src/components/applications/calendar-header.tsx` | modify | mock 패턴 (view 토글 헤더 포함) |
| `frontend/src/components/applications/calendar-legend.tsx` | modify | mock STAGE_LEGEND |
| `frontend/src/components/applications/day-cell.tsx` | modify | mock day-cell |
| `frontend/src/components/applications/event-chip.tsx` | modify | mock event-chip |
| `frontend/src/components/applications/event-edit-modal.tsx` | modify | mock EventDetailModal (line 122-189) |
| `frontend/src/components/applications/event-create-modal.tsx` | modify | mock create modal (또는 EventDetailModal 와 통합) |
| `frontend/src/lib/mock/applications.ts` | create | KAN_COLS_MOCK · HISTORY_MOCK · STAGE_LEGEND_MOCK |
| `frontend/src/styles/kit.css` | append | mock kit-applications.css 의 .ap-/.cal-/.kan-/.hist-* selector port |
| `frontend/src/components/applications/__tests__/{kanban,calendar-year,calendar-week,calendar-day,history-view}.test.tsx` | create | 5 smoke tests |
| 기존 `frontend/src/components/applications/__tests__/*` | modify | task 9 일괄 갱신 |

**Delete (task 8 확인 후)**:
- `applications-content.tsx` (table 흐름 — 칸반으로 대체)
- `applications-table.tsx` / `applications-header.tsx` / `application-filters.tsx` / `application-edit-modal.tsx` (사용처 0 시)

---

## Task 1: cluster shell — ap-side-nav + layout (commit 1)

**Files:**
- Create: `frontend/src/components/applications/ap-side-nav.tsx`
- Create or Modify: `frontend/src/app/(app)/applications/layout.tsx`

mock JSX [screen-applications.jsx:6-30](design_system/project/ui_kits/web/screen-applications.jsx) — AP_NAV + ApSideNav.

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git checkout develop && git pull origin develop
git checkout -b feat/realign-applications
git branch --show-current  # feat/realign-applications
```

- [ ] **Step 2: ap-side-nav.tsx 신규**

`frontend/src/components/applications/ap-side-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { id: "calendar" | "kanban" | "history"; label: string; href: string };

const AP_NAV: NavItem[] = [
  { id: "calendar", label: "캘린더", href: "/applications/calendar" },
  { id: "kanban",   label: "칸반",   href: "/applications" },
  { id: "history",  label: "히스토리", href: "/applications/history" },
];

export function ApSideNav() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="side-nav">
      <div className="crumb">지원 현황</div>
      {AP_NAV.map((item) => {
        const active =
          item.href === "/applications"
            ? pathname === "/applications"
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

- [ ] **Step 3: layout.tsx 신규 또는 갱신**

기존 layout 이 있는지 확인:
```bash
ls frontend/src/app/\(app\)/applications/layout.tsx 2>/dev/null
```

없으면 신규 작성:

```tsx
"use client";

import { ApSideNav } from "@/components/applications/ap-side-nav";

export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ap-shell">
      <ApSideNav />
      <main className="ap-main">{children}</main>
    </div>
  );
}
```

`.ap-shell` / `.ap-main` 이 kit.css 에 없다면 port (단순 grid):

```css
.ap-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: calc(100vh - 56px);
}
.ap-main { overflow: auto; }
```

- [ ] **Step 4: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

- [ ] **Step 5: 커밋**

```bash
cd /Users/sungjiwon/claude/2chi_v1
git add frontend/src/components/applications/ap-side-nav.tsx \
        frontend/src/app/\(app\)/applications/layout.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(ap): cluster shell — ap-side-nav + layout

mock 의 AP_NAV + ApSideNav (screen-applications.jsx line 6-30) 패턴 도입.

- ap-side-nav.tsx: 3-item (캘린더 · 칸반 · 히스토리) + crumb "지원 현황"
- layout.tsx: .ap-shell + .ap-main grid. me/company PR 의 .side-nav 클래스
  재사용

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: KanbanView + /applications 칸반 전환 (commit 2)

**Files:**
- Create: `frontend/src/components/applications/kanban-view.tsx`
- Create: `frontend/src/lib/mock/applications.ts` (KAN_COLS_MOCK)
- Modify: `frontend/src/app/(app)/applications/page.tsx`
- Create: `frontend/src/components/applications/__tests__/kanban-view.test.tsx`

mock JSX [screen-applications.jsx:402-491](design_system/project/ui_kits/web/screen-applications.jsx) — KAN_COLS + KanbanView.

- [ ] **Step 1: mock/applications.ts 신규 + KAN_COLS_MOCK**

`frontend/src/lib/mock/applications.ts`:

```ts
export type KanbanCard = {
  id: string;
  company: string;
  title: string;
  dday: string;        // "D-3" / "마감" / "오늘"
  stage: string;       // "서류" / "코테" / "1차" / "2차" / "최종"
};

export type KanbanColumn = {
  id: "doc" | "code" | "int1" | "int2" | "final" | "result";
  label: string;
  tone: "doc" | "code" | "int1" | "int2" | "final" | "result";
  cards: KanbanCard[];
};

export const KAN_COLS_MOCK: KanbanColumn[] = [
  // implementer 가 mock KAN_COLS (line 402-422) 그대로 옮김
  // 5-6 columns × 1-3 cards each
];
```

(implementer 가 mock 의 정확한 KAN_COLS 데이터 추출.)

- [ ] **Step 2: 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KanbanView } from "../kanban-view";
import { KAN_COLS_MOCK } from "@/lib/mock/applications";

describe("KanbanView", () => {
  it("renders all kanban columns", () => {
    render(<KanbanView columns={KAN_COLS_MOCK} />);
    KAN_COLS_MOCK.forEach((col) => {
      expect(screen.getAllByText(col.label).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders cards with company + title + dday", () => {
    render(<KanbanView columns={KAN_COLS_MOCK} />);
    const firstCard = KAN_COLS_MOCK[0]?.cards[0];
    if (firstCard) {
      expect(screen.getByText(firstCard.company)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 3: kanban-view.tsx 신규**

mock JSX (line 423-491) 의 마크업 그대로. props: `{ columns: KanbanColumn[] }`. className 1:1 정합.

- [ ] **Step 4: /applications/page.tsx 갱신**

기존 applications-content (table) 제거. KanbanView 로:

```tsx
import { KanbanView } from "@/components/applications/kanban-view";
import { KAN_COLS_MOCK } from "@/lib/mock/applications";

export default function ApplicationsPage() {
  return <KanbanView columns={KAN_COLS_MOCK} />;
}
```

(BE 가 단계별 분류 endpoint 미지원이면 mock 우선. 향후 BE 가 단계별 API 노출 시 prop drilling 으로 교체.)

- [ ] **Step 5: 빌드 + lint + test + kit.css port**

mock kit-applications.css 의 .kan-* selector port. Expected: 165 tests passed (163 + 2 신규).

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/components/applications/kanban-view.tsx \
        frontend/src/components/applications/__tests__/kanban-view.test.tsx \
        frontend/src/lib/mock/applications.ts \
        frontend/src/app/\(app\)/applications/page.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(ap): KanbanView + /applications 칸반 전환

mock: screen-applications.jsx 의 KAN_COLS (line 402) + KanbanView (line 423-491).

- /applications: table 흐름 (applications-content) → kanban-view
- kanban-view.tsx: 단계별 칼럼 (서류·코테·1차·2차·최종·결과) + 카드
- mock/applications.ts: KAN_COLS_MOCK (BE 단계별 endpoint 미지원, UI mock)
- smoke test 2

applications-content / applications-table / applications-header /
application-filters 컴포넌트는 task 8 에서 사용처 0 확인 후 삭제.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: CalendarMonth + view 토글 셸 (commit 3)

**Files:**
- Modify: `frontend/src/components/applications/calendar-content.tsx` (view 토글 셸 + sub-view 선택)
- Rename + Modify: `calendar-grid.tsx` → `calendar-month.tsx`
- Modify: `calendar-header.tsx` / `calendar-legend.tsx` / `day-cell.tsx` / `event-chip.tsx`

mock JSX [screen-applications.jsx:66-121](design_system/project/ui_kits/web/screen-applications.jsx) — CalendarView (4-view 토글) + [line 190-230](design_system/project/ui_kits/web/screen-applications.jsx) — CalendarMonth.

- [ ] **Step 1: calendar-month.tsx (rename)**

`git mv calendar-grid.tsx calendar-month.tsx`. mock CalendarMonth (line 190-230) 마크업으로 정합.

- [ ] **Step 2: calendar-content.tsx 갱신 — view 토글 셸**

```tsx
"use client";
import { useState } from "react";
import { CalendarMonth } from "./calendar-month";
// import 나머지 view 는 task 4, 5 에서

type View = "year" | "month" | "week" | "day";

export function CalendarContent() {
  const [view, setView] = useState<View>("month");
  // ... view 토글 헤더 + 선택된 view render
}
```

- [ ] **Step 3: calendar-header.tsx + calendar-legend.tsx + day-cell.tsx + event-chip.tsx 마크업 정합**

mock 의 각 작은 컴포넌트 마크업과 비교 후 className 1:1 정합.

- [ ] **Step 4: 빌드 + lint + test + kit.css port**

기존 calendar 테스트 통합 갱신. 깨지는 케이스 임시 skip + `// TODO Task 9`.

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/components/applications/calendar-content.tsx \
        frontend/src/components/applications/calendar-month.tsx \
        frontend/src/components/applications/calendar-header.tsx \
        frontend/src/components/applications/calendar-legend.tsx \
        frontend/src/components/applications/day-cell.tsx \
        frontend/src/components/applications/event-chip.tsx \
        frontend/src/components/applications/__tests__/ \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
refactor(ap): CalendarMonth + view 토글 셸

mock: screen-applications.jsx 의 CalendarView (line 66-121) + CalendarMonth
(line 190-230) + day-cell / event-chip / STAGE_LEGEND 정합.

- calendar-grid.tsx → calendar-month.tsx rename + mock 마크업 정합
- calendar-content.tsx: view state (year/month/week/day) + 토글 셸 도입.
  year/week/day sub-view 는 task 4, 5 에서 추가
- calendar-header / calendar-legend / day-cell / event-chip 마크업 정합

기존 events API 호출 그대로. 일부 통합 테스트 임시 skip — task 9 갱신.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: CalendarYear sub-view 신규 (commit 4)

**Files:**
- Create: `frontend/src/components/applications/calendar-year.tsx`
- Modify: `frontend/src/components/applications/calendar-content.tsx` (year 분기 추가)
- Create: `frontend/src/components/applications/__tests__/calendar-year.test.tsx`

mock JSX [screen-applications.jsx:231-280](design_system/project/ui_kits/web/screen-applications.jsx) — CalendarYear (12개월 mini grid).

- [ ] **Step 1: 실패 테스트**

```tsx
describe("CalendarYear", () => {
  it("renders 12 months", () => {
    render(<CalendarYear year={2026} events={[]} onPickDate={() => {}} />);
    // 1월 ~ 12월 헤더 확인
    expect(screen.getByText(/1월|JAN/)).toBeInTheDocument();
    expect(screen.getByText(/12월|DEC/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: calendar-year.tsx 신규**

mock 마크업 그대로. 12개월 mini grid + 이벤트 도트 표시.

- [ ] **Step 3: calendar-content.tsx 의 view === "year" 분기 추가**

- [ ] **Step 4: 빌드 + lint + test + kit.css port**

Expected: 167 tests passed (165 + 2 신규).

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/components/applications/calendar-year.tsx \
        frontend/src/components/applications/calendar-content.tsx \
        frontend/src/components/applications/__tests__/calendar-year.test.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(ap): CalendarYear sub-view 신규

mock: screen-applications.jsx 의 CalendarYear (line 231-280) — 12개월 mini
grid + 이벤트 도트.

calendar-content.tsx 의 view === "year" 분기에서 렌더. 기존 events API 그대로.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: CalendarWeek + CalendarDay sub-view 신규 (commit 5)

**Files:**
- Create: `frontend/src/components/applications/calendar-week.tsx`
- Create: `frontend/src/components/applications/calendar-day.tsx`
- Modify: `frontend/src/components/applications/calendar-content.tsx` (week/day 분기 추가)
- Create: `frontend/src/components/applications/__tests__/calendar-week.test.tsx`
- Create: `frontend/src/components/applications/__tests__/calendar-day.test.tsx`

mock JSX [screen-applications.jsx:281-401](design_system/project/ui_kits/web/screen-applications.jsx) — CalendarWeek (line 281-334) + CalendarDay (line 335-401).

- [ ] **Step 1: calendar-week.tsx + test**

mock CalendarWeek (~55줄) 마크업 — 7일 × 시간 grid. 24시간 또는 핵심 시간대 (예: 08-22).

- [ ] **Step 2: calendar-day.tsx + test**

mock CalendarDay (~65줄) 마크업 — 단일 일 시간 stack.

- [ ] **Step 3: calendar-content.tsx week/day 분기 추가**

- [ ] **Step 4: 빌드 + lint + test + kit.css port**

Expected: 171 tests passed (167 + 4 신규).

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/components/applications/calendar-week.tsx \
        frontend/src/components/applications/calendar-day.tsx \
        frontend/src/components/applications/calendar-content.tsx \
        frontend/src/components/applications/__tests__/calendar-week.test.tsx \
        frontend/src/components/applications/__tests__/calendar-day.test.tsx \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(ap): CalendarWeek + CalendarDay sub-view 신규

mock: screen-applications.jsx 의 CalendarWeek (line 281-334) + CalendarDay
(line 335-401).

- calendar-week: 7일 × 시간 grid
- calendar-day: 단일 일 시간 stack
- calendar-content view 토글에 week / day 분기 추가

기존 events API 그대로. 시간 grid 의 범위는 mock 따라 (기본 08-22 추정).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: EventDetailModal + event modals 정합 (commit 6)

**Files:**
- Modify: `frontend/src/components/applications/event-edit-modal.tsx` (mock EventDetailModal 패턴)
- Modify: `frontend/src/components/applications/event-create-modal.tsx` (또는 통합)

mock JSX [screen-applications.jsx:122-189](design_system/project/ui_kits/web/screen-applications.jsx) — EventDetailModal.

- [ ] **Step 1: mock 패턴 분석**

mock 의 EventDetailModal 마크업 (.modal / .modal-backdrop 또는 generic modal pattern).

- [ ] **Step 2: event-edit-modal + event-create-modal 정합**

기존 modal 마크업을 mock 패턴 (또는 cover-letters PR #19 에서 도입한 .pf-modal 재사용) 으로 변경. 기존 props · onClose 유지.

- [ ] **Step 3: 빌드 + lint + test**

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/applications/event-edit-modal.tsx \
        frontend/src/components/applications/event-create-modal.tsx \
        frontend/src/styles/kit.css 2>/dev/null
git commit -m "$(cat <<'EOF'
refactor(ap): EventDetailModal + event modals 패턴 정합

mock: screen-applications.jsx 의 EventDetailModal (line 122-189).

event-edit-modal / event-create-modal 의 className 을 mock 패턴 (또는
이미 도입된 .pf-modal generic pattern) 으로 정합. props · onClose 로직
그대로.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: HistoryView + /applications/history 신규 (commit 7)

**Files:**
- Create: `frontend/src/app/(app)/applications/history/page.tsx`
- Create: `frontend/src/components/applications/history-view.tsx`
- Create: `frontend/src/components/applications/history-row.tsx`
- Modify: `frontend/src/lib/mock/applications.ts` (HISTORY_MOCK append)
- Create: `frontend/src/components/applications/__tests__/history-view.test.tsx`

mock JSX [screen-applications.jsx:492-604](design_system/project/ui_kits/web/screen-applications.jsx) — HistoryRow (line 492) + HistoryView (line 505-604).

- [ ] **Step 1: HISTORY_MOCK 추가**

`mock/applications.ts` 끝에 append:

```ts
export type HistoryEntry = {
  id: string;
  time: string;           // "오늘 14:00" / "어제 09:30"
  icon: string;           // icon name from global Ico
  iconTone: "default" | "mint" | "lav" | "pink";
  msg: string;            // "카카오 백엔드 1차 면접 D-2"
  actor: string;          // "이취 알림" / "본인"
};

export const HISTORY_MOCK: HistoryEntry[] = [
  // implementer 가 mock HistoryView 본문에서 5-10건 추출
];
```

- [ ] **Step 2: history-row.tsx + history-view.tsx 신규**

mock 마크업 그대로. props: `{ entries: HistoryEntry[] }`. timeline 패턴.

- [ ] **Step 3: 실패 테스트**

```tsx
describe("HistoryView", () => {
  it("renders all history entries", () => {
    render(<HistoryView entries={HISTORY_MOCK} />);
    HISTORY_MOCK.forEach((e) => {
      expect(screen.getByText(e.msg)).toBeInTheDocument();
    });
  });

  it("renders empty state", () => {
    render(<HistoryView entries={[]} />);
    expect(screen.getByText(/아직 활동 기록이|히스토리/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: /applications/history/page.tsx 신규**

```tsx
import { HistoryView } from "@/components/applications/history-view";
import { HISTORY_MOCK } from "@/lib/mock/applications";

export default function ApplicationsHistoryPage() {
  return <HistoryView entries={HISTORY_MOCK} />;
}
```

- [ ] **Step 5: 빌드 + lint + test + kit.css port**

Expected: 173 tests passed (171 + 2).

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/app/\(app\)/applications/history/ \
        frontend/src/components/applications/history-view.tsx \
        frontend/src/components/applications/history-row.tsx \
        frontend/src/components/applications/__tests__/history-view.test.tsx \
        frontend/src/lib/mock/applications.ts \
        frontend/src/styles/kit.css
git commit -m "$(cat <<'EOF'
feat(ap): HistoryView + /applications/history 신규 (UI mock-only)

mock: screen-applications.jsx 의 HistoryRow (line 492) + HistoryView
(line 505-604).

- /applications/history 신규 라우트
- history-view + history-row: timeline 패턴 (time · icon · msg · actor)
- mock/applications.ts: HistoryEntry 타입 + HISTORY_MOCK 5-10건
- smoke test 2 (entries 표시 · 빈 상태)

UI mock-only — BE activity-log endpoint 별도 issue spawn 예정.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: cluster-local 자산 정리 + kit.css port (commit 8)

**Files:**
- Delete (사용처 0 확인 후): `applications-content.tsx` / `applications-table.tsx` / `applications-header.tsx` / `application-filters.tsx` / `application-edit-modal.tsx`
- Modify: `frontend/src/styles/kit.css` (mock kit-applications.css 잔여 selector port)

dashboard.css / career.css 패턴.

- [ ] **Step 1: table 흐름 컴포넌트 사용처 확인**

```bash
cd /Users/sungjiwon/claude/2chi_v1
for f in applications-content applications-table applications-header application-filters application-edit-modal; do
  echo "--- $f ---"
  grep -rn "$f" frontend/src --include="*.tsx" --include="*.ts" | grep -v "components/applications/${f}.tsx" | head -3
done
```

각 컴포넌트 사용처 0 이면 → 삭제.

```bash
git rm frontend/src/components/applications/applications-content.tsx 2>/dev/null
git rm frontend/src/components/applications/applications-table.tsx 2>/dev/null
git rm frontend/src/components/applications/applications-header.tsx 2>/dev/null
git rm frontend/src/components/applications/application-filters.tsx 2>/dev/null
git rm frontend/src/components/applications/application-edit-modal.tsx 2>/dev/null
```

(application-edit-modal 은 편집 흐름이 다른 곳에서 쓰이면 보존.)

- [ ] **Step 2: kit-applications.css cross-check**

```bash
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" design_system/project/ui_kits/web/kit-applications.css | sort -u > /tmp/ap_mock.txt
grep -oE "^\.[a-zA-Z-][a-zA-Z0-9-]*" frontend/src/styles/kit.css | sort -u > /tmp/kit_fe.txt
comm -23 /tmp/ap_mock.txt /tmp/kit_fe.txt > /tmp/ap_missing.txt
wc -l /tmp/ap_missing.txt
cat /tmp/ap_missing.txt
```

각 missing 의 사용처 확인 → port (used) or drop (orphan).

- [ ] **Step 3: 빌드 + lint + test**

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/applications/ frontend/src/styles/kit.css
git status --short
git commit -m "$(cat <<'EOF'
chore(ap): cluster-local 자산 정리 (table 흐름 제거) + kit.css port

- applications-content / applications-table / applications-header /
  application-filters / application-edit-modal 삭제 (table 흐름 → 칸반
  전환으로 사용처 0)
- mock kit-applications.css 의 ap-specific selector 중 사용 중인 것 port,
  미사용 orphan drop

dashboard.css (788줄) / career.css (966줄) 와 같은 패턴.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: 통합 테스트 갱신 (commit 9)

**Files:**
- Modify: `frontend/src/components/applications/__tests__/*.test.tsx` (skip 일괄 해제)

- [ ] **Step 1: skip 식별**

```bash
cd /Users/sungjiwon/claude/2chi_v1/frontend
grep -rn "it.skip\|test.skip" src/components/applications/__tests__/
```

- [ ] **Step 2: 각 skip 케이스 갱신 (rewrite / delete / replace)**

- [ ] **Step 3: 빌드 + lint + test**

```bash
cd frontend && npm run lint && npm run test && npm run build
```

Expected: skip 0, 모든 테스트 PASS.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/applications/__tests__/
git commit -m "$(cat <<'EOF'
test(ap): 통합 테스트 갱신 — mock 정렬 마크업에 맞춤

task 2/3/5/6/7 에서 임시 it.skip 처리한 케이스 일괄 해제. className 기반
셀렉터 + mock JSX 카피 사용. skip 0건.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 최종 단계 — push + PR 생성

9 commit 완료 후 controller 수행:

- [ ] develop 동기화
- [ ] dev 서버 sanity (3 routes + calendar 4 view 토글)
- [ ] `git push -u origin feat/realign-applications`
- [ ] `gh pr create --base develop --title "feat: realign applications cluster — design_system mock 픽셀 재현 (2단계 5번)"`

---

## 완료 조건

- 9 task commit 완료
- 각 commit 단위 build/lint/test 통과
- 최종 skip 0건
- 신규 컴포넌트 ~8 (ap-side-nav · kanban · calendar-year/week/day · history-view/row) + 신규 라우트 1 (/history)
- table 흐름 5 컴포넌트 삭제 + 칸반 전환
- mock JSX 의 3-sub-tab IA + 4 calendar sub-view + 마크업 정합
- PR 생성 + CI 통과
