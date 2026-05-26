"use client";

import { useState } from "react";
import { Plus, Edit } from "@/components/ui/icons";
import { ProjectCard } from "./project-card";
import { updateCareer, deleteCareer, createProject, deleteProject } from "@/lib/api/career";
import type { Career, Project, ProjectCreateRequest } from "@/lib/types/career";
import { NewProjectForm } from "./new-project-form";

type Props = {
  career: Career;
  defaultOpen?: boolean;
  onChange: (updated: Career) => void;
  onDelete: () => void;
  onError: (message: string) => void;
};

function formatPeriod(career: Career): string {
  const start = career.startDate.slice(0, 7).replace("-", ".");
  const end = career.isCurrent ? "재직 중" : (career.endDate ? career.endDate.slice(0, 7).replace("-", ".") : "—");
  return `${start} ~ ${end}`;
}

function calcMark(company: string): string {
  return company.replace(/[\s(주)]/g, "").slice(0, 1) || "사";
}

export function CareerCard({ career, defaultOpen = false, onChange, onDelete, onError }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    company: career.company,
    position: career.position ?? "",
    startDate: career.startDate,
    endDate: career.endDate,
  });
  const [addingProject, setAddingProject] = useState(false);

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

  async function handleAddProject(req: ProjectCreateRequest) {
    try {
      const newProject = await createProject(career.id, req);
      onChange({ ...career, projects: [newProject, ...career.projects] });
      setAddingProject(false);
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

  const mark = calcMark(career.company);
  const markTone = career.isCurrent ? "" : "lav";
  const statusPill = career.isCurrent ? "재직 중" : `퇴사 · ${career.endDate ? career.endDate.slice(0, 7).replace("-", ".") : ""}`;
  const period = formatPeriod(career);

  return (
    <div className={"co-band" + (career.isCurrent ? " current" : "")}>
      <div className="co-band-head">
        <span className={"co-mark " + markTone}>{mark}</span>
        <div
          className="co-band-info"
          style={{ cursor: editing ? "default" : "pointer" }}
          onClick={() => !editing && setOpen((o) => { if (o) setAddingProject(false); return !o; })}
        >
          {editing ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="회사명" style={{ padding: 8 }} />
              <input value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} placeholder="직책" style={{ padding: 8 }} />
              <input value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} placeholder="시작 (YYYY-MM-DD)" style={{ padding: 8 }} />
              <input value={draft.endDate ?? ""} onChange={(e) => setDraft({ ...draft, endDate: e.target.value || null })} placeholder="종료 (YYYY-MM-DD 또는 비움=재직중)" style={{ padding: 8 }} />
            </div>
          ) : (
            <>
              <div className="nm">
                {career.company}
                <span className={"pill " + (career.isCurrent ? "" : "past")}>{statusPill}</span>
              </div>
              <div className="meta">
                <span className="role">{career.position ?? "직책 미입력"}</span>
                <span className="sep" />
                <span>{period}</span>
                {career.projects.length > 0 && (
                  <>
                    <span className="sep" />
                    <span>프로젝트 {career.projects.length}건</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <div className="co-band-actions">
          {editing ? (
            <>
              <button className="iconbtn-sm" onClick={saveEdit}>저장</button>
              <button
                className="iconbtn-sm"
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
              <button className="iconbtn-sm" onClick={handleDelete}>삭제</button>
            </>
          ) : (
            <button className="iconbtn-sm" onClick={() => setEditing(true)}><Edit size={12} />편집</button>
          )}
        </div>
      </div>

      {open && (
        <div className="co-band-body">
          <div className="pj-list">
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
          </div>
          {!addingProject ? (
            <button className="add-proj-sm" onClick={() => setAddingProject(true)}>
              <Plus size={12} />프로젝트 추가
            </button>
          ) : (
            <NewProjectForm
              onSubmit={handleAddProject}
              onCancel={() => setAddingProject(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
