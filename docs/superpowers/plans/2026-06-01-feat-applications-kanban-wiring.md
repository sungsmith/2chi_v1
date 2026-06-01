# 지원현황 Kanban 실배선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/applications` Kanban 보드를 정적 mock에서 실 Application 데이터로 배선하고, 카드에서 단계를 변경(PATCH)할 수 있게 한다.

**Architecture:** `KanbanView`를 self-fetching client 컴포넌트로 재작성(`calendar-content.tsx` 패턴). 컬럼 = 활성 단계 6개, Result 필터 탭으로 `currentResult` 필터·카운트. 카드별 stage `<select>`로 단계 변경(낙관적 업데이트 + `patchApplication` + 실패 시 되돌림). 드래그는 v2.

**Tech Stack:** Next.js(App Router) + React + Vitest/RTL (FE). 기존 `@/lib/api/application`·`@/lib/types/application` 활용.

**Spec:** `docs/superpowers/specs/2026-06-01-feat-applications-kanban-wiring-design.md`

**참고:** `frontend/AGENTS.md` — Next.js 특이사항. 본 작업은 React state + fetch라 표준 React. 배선 레퍼런스: `frontend/src/components/applications/calendar-content.tsx`(`Promise.all` fetch + `refreshTick`).

---

## 기존 타입 (이미 정의됨 — 그대로 사용)
- `ApplicationSummary = { id, postingId, company, role, currentStage: Stage, currentResult: Result, variantsCount, nextEvent: ApplicationEvent|null, updatedAt }`
- `Stage`(8): DOC_SUBMITTED·CODING_TEST·FIRST_INTERVIEW·SECOND_INTERVIEW·EXEC_INTERVIEW·NEGOTIATION·PASSED·FAILED
- `Result`(4): IN_PROGRESS·PASSED·FAILED·WITHDRAWN
- `STAGE_LABEL: Record<Stage,string>`, `RESULT_LABEL` — `@/lib/types/application`
- API: `fetchApplications(filter?): Promise<ApplicationSummary[]>`, `patchApplication(id, { currentStage?, currentResult? }): Promise<Application>`

## File Structure
| 파일 | 작업 |
|---|---|
| `frontend/src/components/applications/kanban-view.tsx` | mock-props → self-fetching 실데이터 + 단계변경 |
| `frontend/src/app/(app)/applications/page.tsx` | `<KanbanView />`(무 props), mock import 제거 |
| `frontend/src/styles/kit.css` | `.dot.nego` 색 추가(6번째 컬럼) |
| `frontend/src/lib/mock/applications.ts` | 미사용화 — 다른 참조 없으면 삭제 |
| `frontend/src/components/applications/__tests__/kanban-view.test.tsx` | 신규 테스트 |

---

## Task 1: KanbanView 실데이터 렌더 (단계변경 제외)

**Files:**
- Modify: `frontend/src/components/applications/kanban-view.tsx`
- Modify: `frontend/src/app/(app)/applications/page.tsx`
- Modify: `frontend/src/styles/kit.css`
- Test: `frontend/src/components/applications/__tests__/kanban-view.test.tsx` (신규)

- [ ] **Step 1: Write the failing test**

`frontend/src/components/applications/__tests__/kanban-view.test.tsx`:

```tsx
import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanView } from "../kanban-view";
import type { ApplicationSummary } from "@/lib/types/application";

const fetchMock = vi.fn();
const patchMock = vi.fn();
vi.mock("@/lib/api/application", () => ({
  fetchApplications: () => fetchMock(),
  patchApplication: (...a: unknown[]) => patchMock(...a),
}));

function app(over: Partial<ApplicationSummary>): ApplicationSummary {
  return {
    id: 1, postingId: 1, company: "카카오", role: "백엔드",
    currentStage: "DOC_SUBMITTED", currentResult: "IN_PROGRESS",
    variantsCount: 0, nextEvent: null, updatedAt: "2026-05-30T00:00:00Z", ...over,
  };
}

beforeEach(() => { fetchMock.mockReset(); patchMock.mockReset(); });

describe("KanbanView", () => {
  test("실데이터를 단계 컬럼에 그룹핑해 렌더", async () => {
    fetchMock.mockResolvedValue([
      app({ id: 1, company: "카카오", currentStage: "DOC_SUBMITTED" }),
      app({ id: 2, company: "네이버", currentStage: "FIRST_INTERVIEW" }),
    ]);
    render(<KanbanView />);
    await waitFor(() => expect(screen.getByText("카카오")).toBeInTheDocument());
    expect(screen.getByText("네이버")).toBeInTheDocument();
  });

  test("Result 탭으로 필터 — 합격 탭은 합격 지원만", async () => {
    fetchMock.mockResolvedValue([
      app({ id: 1, company: "카카오", currentResult: "IN_PROGRESS" }),
      app({ id: 2, company: "네이버", currentResult: "PASSED", currentStage: "PASSED" }),
    ]);
    render(<KanbanView />);
    await waitFor(() => expect(screen.getByText("카카오")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /합격/ }));
    expect(screen.queryByText("카카오")).not.toBeInTheDocument();
    expect(screen.getByText("네이버")).toBeInTheDocument();
  });

  test("지원 0건이면 빈 상태", async () => {
    fetchMock.mockResolvedValue([]);
    render(<KanbanView />);
    await waitFor(() => expect(screen.getByText(/아직 지원이 없어요/)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- kanban-view`
Expected: FAIL — 현재 `KanbanView`는 `columns` props mock 렌더라 fetch 안 함(카카오 못 찾음) + 빈 상태 문구 없음.

- [ ] **Step 3: Rewrite KanbanView as self-fetching real-data component**

`kanban-view.tsx` 전체를 교체. 핵심 로직(마크업 클래스는 기존 `.kanban`/`.kanban-col`/`.kan-card`/`.kan-toolbar`/`.filter-chips` 등 유지 — 기존 파일에서 그대로 따옴):

```tsx
"use client";

import { useEffect, useState } from "react";
import { fetchApplications } from "@/lib/api/application";
import { STAGE_LABEL, type ApplicationSummary, type Stage, type Result } from "@/lib/types/application";

// 활성 단계 컬럼 (종료 단계 PASSED/FAILED 는 Result 필터로 처리)
const COLUMNS: { stage: Stage; dot: string }[] = [
  { stage: "DOC_SUBMITTED",    dot: "doc"  },
  { stage: "CODING_TEST",      dot: "code" },
  { stage: "FIRST_INTERVIEW",  dot: "int1" },
  { stage: "SECOND_INTERVIEW", dot: "int2" },
  { stage: "EXEC_INTERVIEW",   dot: "exec" },
  { stage: "NEGOTIATION",      dot: "nego" },
];

type ResultFilter = "all" | "IN_PROGRESS" | "PASSED" | "FAILED";

export function KanbanView() {
  const [apps, setApps] = useState<ApplicationSummary[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<ResultFilter>("all");

  useEffect(() => {
    fetchApplications()
      .then(setApps)
      .catch((e) => setError(e instanceof Error ? e.message : "지원 목록을 불러오지 못했어요."));
  }, []);

  if (error) {
    return <section style={{ padding: 24 }}><div role="alert" className="helper error">{error}</div></section>;
  }
  if (apps === null) {
    return <section style={{ padding: 24, color: "var(--color-text-secondary)" }}>불러오는 중…</section>;
  }

  const count = (r: ResultFilter) => r === "all" ? apps.length : apps.filter(a => a.currentResult === r).length;
  const visible = result === "all" ? apps : apps.filter(a => a.currentResult === result);

  return (
    <>
      <section className="ap-head">
        <div>
          <h1>지원 대시보드</h1>
          <div className="sub">전형 단계별로 진행 중인 지원을 한눈에. 카드에서 단계를 바꿀 수 있어요.</div>
        </div>
      </section>

      <div className="kan-toolbar">
        <div className="filter-chips">
          <button className={result === "all"         ? "active" : ""} onClick={() => setResult("all")}>전체 <span className="n">{count("all")}</span></button>
          <button className={result === "IN_PROGRESS" ? "active" : ""} onClick={() => setResult("IN_PROGRESS")}>진행중 <span className="n">{count("IN_PROGRESS")}</span></button>
          <button className={result === "PASSED"      ? "active" : ""} onClick={() => setResult("PASSED")}>합격 <span className="n">{count("PASSED")}</span></button>
          <button className={result === "FAILED"      ? "active" : ""} onClick={() => setResult("FAILED")}>불합격 <span className="n">{count("FAILED")}</span></button>
        </div>
      </div>

      {apps.length === 0 ? (
        <section className="empty-state" style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)" }}>
          아직 지원이 없어요. 공고에서 “지원함”을 눌러 추가해보세요.
        </section>
      ) : (
        <div className="kanban">
          {COLUMNS.map(col => {
            const items = visible.filter(a => a.currentStage === col.stage);
            return (
              <div key={col.stage} className="kanban-col">
                <div className="kanban-col-head">
                  <span className="nm"><span className={"dot " + col.dot}/>{STAGE_LABEL[col.stage]}</span>
                  <span className="count">{items.length}</span>
                </div>
                {items.map(a => (
                  <article key={a.id} className="kan-card">
                    <div className="row1">
                      <span className="co">{a.company}</span>
                    </div>
                    <div className="pos">{a.role}</div>
                    <div className="meta"><span>{a.updatedAt.slice(0, 10)}</span></div>
                  </article>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
```

(주의: 종료 결과(합격/불합격) 카드는 `currentStage`가 PASSED/FAILED일 수 있어 활성 6컬럼에 안 들어갈 수 있다 — 이는 Task 1 범위에선 수용. 합격/불합격 탭 선택 시 해당 카드는 자신의 활성 단계에 있으면 보이고, 단계가 PASSED/FAILED면 컬럼이 없어 안 보임. 단계변경 UI(Task 2)에서 합격/불합격 처리 시 결과만 바꾸고 단계는 활성 유지하도록 안내. 더 정교한 종료 카드 뷰는 v2.)

- [ ] **Step 4: page.tsx 배선 + mock 제거**

`frontend/src/app/(app)/applications/page.tsx`:
```tsx
import { KanbanView } from "@/components/applications/kanban-view";

export const metadata = {
  title: "지원 현황 · 2chi",
};

export default function ApplicationsPage() {
  return <KanbanView />;
}
```

- [ ] **Step 5: `.dot.nego` 색 추가**

`frontend/src/styles/kit.css` — `.stage-legend .dot.exec` 줄(2924 부근) 다음, 그리고 `.kanban-col-head .nm .dot.exec`(2956 부근) 다음에 각각 추가:
```css
.stage-legend .dot.nego { background: var(--color-warm-400); }
```
```css
.kanban-col-head .nm .dot.nego { background: var(--color-warm-400); }
```
(`--color-warm-400` 토큰이 없으면 `colors_and_type.css`에서 존재하는 가장 가까운 warm/amber 토큰으로 대체 — 6단계가 시각적으로 구분되게.)

- [ ] **Step 6: Run test to verify it passes**

Run: `cd frontend && npm test -- kanban-view`
Expected: PASS (3 tests).

- [ ] **Step 7: 무참조 확인 + 타입체크**

Run: `cd frontend && grep -rn "KAN_COLS_MOCK\|KanbanColumn" src/ ; npx tsc --noEmit`
Expected: mock 참조가 kanban-view에서 사라짐(다른 참조 없으면 `mock/applications.ts` 삭제 가능 — Step 8). tsc 0 에러.

- [ ] **Step 8: 미사용 mock 정리**

`mock/applications.ts`에 다른 참조가 없으면 삭제:
```bash
cd frontend && grep -rn "lib/mock/applications" src/ || git rm src/lib/mock/applications.ts
```

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/applications/kanban-view.tsx \
        frontend/src/app/\(app\)/applications/page.tsx \
        frontend/src/styles/kit.css \
        frontend/src/components/applications/__tests__/kanban-view.test.tsx
git add -A frontend/src/lib/mock/applications.ts 2>/dev/null || true
git commit -m "feat(ap): 지원현황 Kanban 실데이터 배선 + Result 필터 (베타 #2)"
```

---

## Task 2: 카드 단계 변경 (PATCH + 낙관적 업데이트)

**Files:**
- Modify: `frontend/src/components/applications/kanban-view.tsx`
- Test: `frontend/src/components/applications/__tests__/kanban-view.test.tsx`

- [ ] **Step 1: Write the failing test (append)**

위 테스트 파일 describe 안에 추가:
```tsx
  test("카드 단계 select 변경 → patchApplication 호출 + 낙관적 이동", async () => {
    fetchMock.mockResolvedValue([app({ id: 5, company: "토스", currentStage: "DOC_SUBMITTED" })]);
    patchMock.mockResolvedValue({});
    render(<KanbanView />);
    await waitFor(() => expect(screen.getByText("토스")).toBeInTheDocument());
    const select = screen.getByLabelText("토스 단계 변경");
    await userEvent.selectOptions(select, "FIRST_INTERVIEW");
    await waitFor(() => expect(patchMock).toHaveBeenCalledWith(5, { currentStage: "FIRST_INTERVIEW" }));
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- kanban-view`
Expected: FAIL — 카드에 단계 변경 select 없음(`getByLabelText` 실패).

- [ ] **Step 3: 카드에 단계 변경 select + 낙관적 PATCH 추가**

`kanban-view.tsx`에 `patchApplication` import 추가하고, 단계 변경 핸들러 + 카드 select 추가:
```tsx
import { fetchApplications, patchApplication } from "@/lib/api/application";
```
컴포넌트 본문에 핸들러:
```tsx
  async function changeStage(a: ApplicationSummary, nextStage: Stage) {
    const prev = apps!;
    setApps(prev.map(x => x.id === a.id ? { ...x, currentStage: nextStage } : x)); // 낙관적
    try {
      await patchApplication(a.id, { currentStage: nextStage });
    } catch {
      setApps(prev); // 실패 시 되돌림
      setError("단계 변경에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }
```
카드 마크업의 `.meta` 아래에 select 추가:
```tsx
                    <div className="meta"><span>{a.updatedAt.slice(0, 10)}</span></div>
                    <select
                      aria-label={`${a.company} 단계 변경`}
                      className="kan-stage-select"
                      value={a.currentStage}
                      onChange={(e) => changeStage(a, e.target.value as Stage)}
                    >
                      {(Object.keys(STAGE_LABEL) as Stage[]).map(s => (
                        <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                      ))}
                    </select>
```
(전체 8단계 선택 가능 — 합격/불합격으로 직접 변경도 허용. select 기본 스타일이면 충분; `.kan-stage-select` CSS는 선택 — 없으면 브라우저 기본.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- kanban-view`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/applications/kanban-view.tsx \
        frontend/src/components/applications/__tests__/kanban-view.test.tsx
git commit -m "feat(ap): Kanban 카드 단계 변경(select) — 낙관적 PATCH (베타 #2)"
```

---

## Self-Review 결과
- **Spec coverage:** §3.1 컬럼=활성6+Result필터=Task1 · §3.2 클릭(select)단계변경 PATCH 낙관적=Task2 · §3.3 카드매핑/빈상태=Task1 · 드래그 v2(제외) · "드래그" 카피 수정=Task1 Step3(sub 문구) · mock 제거=Task1 Step8. 정렬 탭·활성필터칩·"지원 추가" 버튼은 mock 장식이라 제거(YAGNI — 정렬은 v1 미포함, 필요 시 후속). → **정렬/활성필터 의도적 제외를 spec 대비 축소**: spec §3.3의 "정렬 탭 클라이언트 정렬"을 v1에서 빼고 카운트·필터에 집중(단순화). 사용자 확인사항으로 남김.
- **Placeholder scan:** 없음. 전 step 실제 코드/명령.
- **Type consistency:** `ApplicationSummary`/`Stage`/`Result`/`STAGE_LABEL`/`patchApplication(id,{currentStage})` 전부 기존 정의와 일치.
