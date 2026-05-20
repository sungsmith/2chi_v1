"use client";

import { useState } from "react";
import { Pencil, Trash, Plus } from "../icons";
import { ProjectCard } from "./project-card";
import { updateCareer, deleteCareer, createProject, deleteProject } from "@/lib/api/career";
import type { Career, Project } from "@/lib/types/career";

type Props = {
  career: Career;
  defaultOpen?: boolean;
  onChange: (updated: Career) => void;
  onDelete: () => void;
  onError: (message: string) => void;
};

export function CareerCard({ career, defaultOpen = false, onChange, onDelete, onError }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    company: career.company,
    position: career.position ?? "",
    startDate: career.startDate,
    endDate: career.endDate,
  });

  async function saveEdit() {
    try {
      const updated = await updateCareer(career.id, {
        company: draft.company,
        position: draft.position || undefined,
        startDate: draft.startDate,
        endDate: draft.endDate,
      });
      onChange(updated);
      setEditing(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "회사 정보 저장에 실패했어요.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`"${career.company}" 와 소속 프로젝트를 모두 삭제할까요?`)) return;
    try {
      await deleteCareer(career.id);
      onDelete();
    } catch (err) {
      onError(err instanceof Error ? err.message : "회사 삭제에 실패했어요.");
    }
  }

  async function handleAddProject() {
    const title = window.prompt("프로젝트 이름");
    if (!title) return;
    const periodStart = window.prompt("시작일 (YYYY-MM-DD)") || null;
    try {
      const newProject = await createProject(career.id, {
        title,
        periodStart,
        periodEnd: null,
        role: null,
      });
      onChange({ ...career, projects: [newProject, ...career.projects] });
    } catch (err) {
      onError(err instanceof Error ? err.message : "프로젝트 추가에 실패했어요.");
    }
  }

  async function handleDeleteProject(projectId: number) {
    if (!window.confirm("이 프로젝트를 삭제할까요?")) return;
    try {
      await deleteProject(career.id, projectId);
      onChange({ ...career, projects: career.projects.filter((p) => p.id !== projectId) });
    } catch (err) {
      onError(err instanceof Error ? err.message : "프로젝트 삭제에 실패했어요.");
    }
  }

  function handleProjectChange(updated: Project) {
    onChange({
      ...career,
      projects: career.projects.map((p) => (p.id === updated.id ? updated : p)),
    });
  }

  return (
    <section className={`career-card ${open ? "open" : ""}`} style={{ marginBottom: 16 }}>
      <header
        className="career-card-head"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          background: "var(--color-surface-default)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <div style={{ flex: 1, cursor: editing ? "default" : "pointer" }} onClick={() => !editing && setOpen((o) => !o)}>
          {editing ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="회사명" style={{ padding: 8 }} />
              <input value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} placeholder="직책" style={{ padding: 8 }} />
              <input value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} placeholder="시작 (YYYY-MM-DD)" style={{ padding: 8 }} />
              <input value={draft.endDate ?? ""} onChange={(e) => setDraft({ ...draft, endDate: e.target.value || null })} placeholder="종료 (YYYY-MM-DD 또는 비움=재직중)" style={{ padding: 8 }} />
            </div>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{career.company}</div>
              <div style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
                {career.position ?? "직책 미입력"} · {career.startDate} ~ {career.isCurrent ? "재직중" : (career.endDate ?? "—")}
              </div>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {editing ? (
            <>
              <button className="btn ghost" onClick={saveEdit}>저장</button>
              <button
                className="btn ghost"
                onClick={() => {
                  setEditing(false);
                  setDraft({
                    company: career.company,
                    position: career.position ?? "",
                    startDate: career.startDate,
                    endDate: career.endDate,
                  });
                }}
              >취소</button>
            </>
          ) : (
            <>
              <button className="btn ghost" onClick={() => setEditing(true)}><Pencil /> 편집</button>
              <button className="btn ghost" onClick={handleDelete}><Trash /> 삭제</button>
            </>
          )}
        </div>
      </header>

      {open && (
        <div style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>프로젝트 ({career.projects.length}건)</div>
          {career.projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              careerId={career.id}
              defaultOpen={i === 0}
              onChange={handleProjectChange}
              onDelete={() => handleDeleteProject(p.id)}
              onError={onError}
            />
          ))}
          <button className="btn ghost" onClick={handleAddProject} style={{ marginTop: 8 }}>
            <Plus size={14} /> 프로젝트 추가
          </button>
        </div>
      )}
    </section>
  );
}
