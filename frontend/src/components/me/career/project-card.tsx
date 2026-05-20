"use client";

import { useState } from "react";
import { ChevronRight, Trash } from "../icons";
import { PrarCell } from "./prar-cell";
import { MetricChip } from "./metric-chip";
import { TechTag } from "./tech-tag";
import { NewMetricForm } from "./new-metric-form";
import { patchProject } from "@/lib/api/career";
import type { Project, ProjectPatchRequest } from "@/lib/types/career";

type Props = {
  project: Project;
  careerId: number;
  defaultOpen?: boolean;
  onChange: (updated: Project) => void;
  onDelete: () => void;
  onError: (message: string) => void;
};

export function ProjectCard({ project, careerId, defaultOpen = false, onChange, onDelete, onError }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [saving, setSaving] = useState(false);
  const [addingMetric, setAddingMetric] = useState(false);

  async function autosave(patch: ProjectPatchRequest) {
    setSaving(true);
    try {
      const updated = await patchProject(careerId, project.id, patch);
      onChange(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "프로젝트 저장에 실패했어요.";
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  const prarFilledCount = [project.prar.problem, project.prar.rootCause, project.prar.approach, project.prar.result]
    .filter((v) => v !== null && v !== "").length;

  return (
    <article className={`pj-card ${open ? "open" : ""}`} style={{ marginBottom: 12 }}>
      <div
        className="pj-head"
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => { if (o) setAddingMetric(false); return !o; })}
        onKeyDown={(e) => { if (e.key === "Enter") setOpen((o) => { if (o) setAddingMetric(false); return !o; }); }}
        style={{ cursor: "pointer" }}
      >
        <span className="chev"><ChevronRight size={14} /></span>
        <div className="pj-title-block">
          <div className="pj-title">
            <span>{project.title}</span>
            <span className="tag-row">
              {project.techStack.map((t, i) => <TechTag key={i} label={t} />)}
            </span>
          </div>
          <div className="pj-meta">
            <span className="dur">
              {project.periodStart ?? "—"} ~ {project.periodEnd ?? "진행중"}
            </span>
            {project.role && (
              <>
                <span className="sep" />
                <span>{project.role}</span>
              </>
            )}
          </div>
        </div>
        <div className="pj-mini-actions" onClick={(e) => e.stopPropagation()}>
          <span className="pill">PRAR {prarFilledCount}/4</span>
          {saving && <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>저장중…</span>}
          <button className="iconbtn" type="button" aria-label="삭제" onClick={onDelete}>
            <Trash />
          </button>
        </div>
      </div>

      {open && (
        <div className="pj-body">
          <div className="prar-grid">
            <PrarCell
              tone="p" glyph="P" ko="문제" en="PROBLEM"
              value={project.prar.problem}
              placeholder="해결해야 했던 문제 상황을 적어주세요"
              onChange={(v) => autosave({ prar: { problem: v } })}
            />
            <PrarCell
              tone="r1" glyph="R" ko="원인" en="ROOT CAUSE"
              value={project.prar.rootCause}
              placeholder="문제의 근본 원인을 분석해 적어주세요"
              onChange={(v) => autosave({ prar: { rootCause: v } })}
            />
            <PrarCell
              tone="a" glyph="A" ko="접근" en="APPROACH"
              value={project.prar.approach}
              placeholder="어떤 방식으로 해결했는지 적어주세요"
              onChange={(v) => autosave({ prar: { approach: v } })}
            />
            <PrarCell
              tone="r2" glyph="R" ko="결과" en="RESULT"
              value={project.prar.result}
              placeholder="달성한 결과를 정량/정성으로 적어주세요"
              onChange={(v) => autosave({ prar: { result: v } })}
            />
          </div>

          <div className="metrics">
            <div className="metrics-head">
              <span className="lbl">
                <span className="glyph">#</span>
                정량 성과
              </span>
              <span className="hint">숫자 변화·금액·사용자 수처럼 비교 가능한 값을 권장합니다</span>
            </div>
            <div className="metric-row">
              {project.metrics.map((m, i) => (
                <MetricChip
                  key={i}
                  variant="metric"
                  metric={m}
                  onDelete={() => {
                    const next = project.metrics.filter((_, j) => j !== i);
                    autosave({ metrics: next });
                  }}
                />
              ))}
              {!addingMetric && (
                <MetricChip
                  variant="add"
                  onAdd={() => setAddingMetric(true)}
                />
              )}
            </div>
            {addingMetric && (
              <NewMetricForm
                onSubmit={(m) => {
                  autosave({ metrics: [...project.metrics, m] });
                  setAddingMetric(false);
                }}
                onCancel={() => setAddingMetric(false)}
              />
            )}
          </div>
        </div>
      )}
    </article>
  );
}
