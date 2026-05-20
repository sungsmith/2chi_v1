"use client";

import { Plus } from "../icons";
import type { Metric } from "@/lib/types/career";

type Props =
  | { variant: "metric"; metric: Metric; onDelete?: () => void }
  | { variant: "add"; onAdd: () => void };

export function MetricChip(props: Props) {
  if (props.variant === "add") {
    return (
      <span
        className="metric-chip add"
        role="button"
        tabIndex={0}
        onClick={props.onAdd}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") props.onAdd(); }}
      >
        <span className="k"><Plus size={12} /> 성과 지표 추가</span>
      </span>
    );
  }

  const m = props.metric;
  const isDelta = "delta" in m;

  return (
    <span className="metric-chip">
      <span className="k">{m.k}</span>
      <span className="v">
        {isDelta ? (
          <span className={(m as { dir: "up" | "down" }).dir === "down" ? "down" : "up"}>
            {(m as { delta: string }).delta}
          </span>
        ) : (
          <>
            {(m as { before: string }).before} <span className="arrow">→</span> {(m as { after: string }).after}
          </>
        )}
      </span>
      {props.onDelete && (
        <button
          type="button"
          aria-label="삭제"
          onClick={props.onDelete}
          style={{ marginLeft: 6, background: "transparent", border: 0, cursor: "pointer", color: "currentColor" }}
        >
          ×
        </button>
      )}
    </span>
  );
}
