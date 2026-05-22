"use client";

import type { ApplicationSummary, Stage, Result } from "@/lib/types/application";
import { STAGE_LABEL, RESULT_LABEL } from "@/lib/types/application";

const STAGES: Stage[] = [
  "DOC_SUBMITTED", "CODING_TEST",
  "FIRST_INTERVIEW", "SECOND_INTERVIEW", "EXEC_INTERVIEW",
  "NEGOTIATION", "PASSED", "FAILED",
];

const RESULTS: (Result | "")[] = ["", "IN_PROGRESS", "PASSED", "FAILED", "WITHDRAWN"];

type Props = {
  apps: ApplicationSummary[];
  stage?: Stage;
  result?: Result;
  sort?: string;
  onStageChange: (s: Stage | undefined) => void;
  onResultChange: (r: Result | undefined) => void;
  onSortChange: (s: string) => void;
};

export function ApplicationFilters(props: Props) {
  const totalCount = props.apps.length;
  const stageCounts: Record<Stage, number> = {
    DOC_SUBMITTED: 0, CODING_TEST: 0,
    FIRST_INTERVIEW: 0, SECOND_INTERVIEW: 0, EXEC_INTERVIEW: 0,
    NEGOTIATION: 0, PASSED: 0, FAILED: 0,
  };
  for (const a of props.apps) stageCounts[a.currentStage]++;

  return (
    <div style={{
      display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16,
      padding: 12, background: "var(--color-surface-default)",
      border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-lg)",
    }}>
      <span style={{ fontSize: 12, fontWeight: 700 }}>전형</span>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button
          className={props.stage === undefined ? "btn" : "btn ghost"}
          style={{ padding: "4px 10px", fontSize: 11 }}
          onClick={() => props.onStageChange(undefined)}
        >전체 {totalCount}</button>
        {STAGES.map((s) => (
          <button
            key={s}
            className={props.stage === s ? "btn" : "btn ghost"}
            style={{ padding: "4px 10px", fontSize: 11 }}
            onClick={() => props.onStageChange(s)}
          >{STAGE_LABEL[s]} {stageCounts[s]}</button>
        ))}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        <select
          value={props.result ?? ""}
          onChange={(e) => props.onResultChange((e.target.value || undefined) as Result | undefined)}
          style={{ padding: "4px 8px", fontSize: 12, borderRadius: "var(--radius-md)" }}
          aria-label="결과 필터"
        >
          {RESULTS.map((r) => (
            <option key={r || "all"} value={r}>{r === "" ? "결과: 전체" : RESULT_LABEL[r as Result]}</option>
          ))}
        </select>
        <select
          value={props.sort ?? "updatedAt"}
          onChange={(e) => props.onSortChange(e.target.value)}
          style={{ padding: "4px 8px", fontSize: 12, borderRadius: "var(--radius-md)" }}
          aria-label="정렬"
        >
          <option value="updatedAt">최신순</option>
          <option value="deadline">마감 임박순</option>
        </select>
      </div>
    </div>
  );
}
