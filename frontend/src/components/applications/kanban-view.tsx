"use client";

import { useEffect, useState } from "react";
import { fetchApplications, patchApplication } from "@/lib/api/application";
import { STAGE_LABEL, type ApplicationSummary, type Stage } from "@/lib/types/application";

const ACTIVE_COLUMNS: { stage: Stage; dot: string }[] = [
  { stage: "DOC_SUBMITTED",    dot: "doc"  },
  { stage: "CODING_TEST",      dot: "code" },
  { stage: "FIRST_INTERVIEW",  dot: "int1" },
  { stage: "SECOND_INTERVIEW", dot: "int2" },
  { stage: "EXEC_INTERVIEW",   dot: "exec" },
  { stage: "NEGOTIATION",      dot: "nego" },
];

type ResultFilter = "all" | "IN_PROGRESS" | "PASSED" | "FAILED";

// 종료 결과 필터(합격/불합격) 선택 시에만 해당 종료 단계 컬럼을 덧붙인다.
const TERMINAL_COLUMN: Partial<Record<ResultFilter, { stage: Stage; dot: string }>> = {
  PASSED: { stage: "PASSED", dot: "ok"   },
  FAILED: { stage: "FAILED", dot: "fail" },
};

export function KanbanView() {
  const [apps, setApps] = useState<ApplicationSummary[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
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

  async function changeStage(target: ApplicationSummary, nextStage: Stage) {
    const prev = apps!;
    setApps(prev.map(x => x.id === target.id ? { ...x, currentStage: nextStage } : x)); // 낙관적
    try {
      await patchApplication(target.id, { currentStage: nextStage });
    } catch {
      setApps(prev); // 실패 시 되돌림 (보드는 유지, 배너로만 안내)
      setActionError("단계 변경에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  const count = (r: ResultFilter) => r === "all" ? apps.length : apps.filter(a => a.currentResult === r).length;
  const visible = result === "all" ? apps : apps.filter(a => a.currentResult === result);

  // When filtering by a terminal result, append the terminal column; otherwise show 6 active columns
  const terminal = TERMINAL_COLUMN[result];
  const columns = terminal ? [...ACTIVE_COLUMNS, terminal] : ACTIVE_COLUMNS;

  return (
    <>
      <section className="ap-head">
        <div>
          <h1>지원 대시보드</h1>
          <div className="sub">전형 단계별로 진행 중인 지원을 한눈에. 카드에서 단계를 바꿀 수 있어요.</div>
        </div>
      </section>

      {actionError && (
        <div role="alert" className="info-banner" style={{ marginBottom: 8 }}>
          <span className="body helper error">{actionError}</span>
          <button type="button" className="x" aria-label="닫기" onClick={() => setActionError(undefined)}>×</button>
        </div>
      )}

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
          아직 지원이 없어요. 공고에서 「지원함」을 눌러 추가해보세요.
        </section>
      ) : (
        <div className="kanban">
          {columns.map(col => {
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
