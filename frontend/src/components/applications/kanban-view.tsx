"use client";

import { useEffect, useState } from "react";
import { fetchApplications } from "@/lib/api/application";
import { STAGE_LABEL, type ApplicationSummary, type Stage } from "@/lib/types/application";

const ACTIVE_COLUMNS: { stage: Stage; dot: string }[] = [
  { stage: "DOC_SUBMITTED",    dot: "doc"  },
  { stage: "CODING_TEST",      dot: "code" },
  { stage: "FIRST_INTERVIEW",  dot: "int1" },
  { stage: "SECOND_INTERVIEW", dot: "int2" },
  { stage: "EXEC_INTERVIEW",   dot: "exec" },
  { stage: "NEGOTIATION",      dot: "nego" },
];

const TERMINAL_COLUMNS: { stage: Stage; dot: string }[] = [
  { stage: "PASSED", dot: "ok"   },
  { stage: "FAILED", dot: "fail" },
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

  // When filtering by a terminal result, append the terminal column; otherwise show 6 active columns
  const columns =
    result === "PASSED" ? [...ACTIVE_COLUMNS, TERMINAL_COLUMNS[0]] :
    result === "FAILED" ? [...ACTIVE_COLUMNS, TERMINAL_COLUMNS[1]] :
    ACTIVE_COLUMNS;

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
          아직 지원이 없어요. 공고에서 "지원함"을 눌러 추가해보세요.
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
