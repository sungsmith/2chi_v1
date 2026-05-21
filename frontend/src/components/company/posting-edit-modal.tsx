"use client";

import { useEffect, useState } from "react";
import { PostingFields, validatePostingFields, type PostingFormValues, type PostingFormErrors } from "./posting-fields";
import { KeywordChipList } from "./keyword-chip-list";
import type { JobPosting, JobPostingPatchRequest } from "@/lib/types/posting";

type Props = {
  posting: JobPosting;
  onClose: () => void;
  onSave: (patch: JobPostingPatchRequest) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function PostingEditModal({ posting, onClose, onSave, onDelete }: Props) {
  const [values, setValues] = useState<PostingFormValues>({
    company: posting.company,
    title: posting.title,
    jobRole: posting.jobRole ?? "",
    deadline: posting.deadline ?? "",
    mainTasks: posting.mainTasks ?? "",
    requirements: posting.requirements ?? "",
    preferred: posting.preferred ?? "",
  });
  const [errors, setErrors] = useState<PostingFormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    const errs = validatePostingFields(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await onSave({
        company: values.company.trim(),
        title: values.title.trim(),
        jobRole: values.jobRole.trim() || null,
        deadline: values.deadline || null,
        mainTasks: values.mainTasks.trim() || null,
        requirements: values.requirements.trim() || null,
        preferred: values.preferred.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`"${posting.title}" 공고를 삭제할까요?`)) return;
    await onDelete();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface-default)", borderRadius: "var(--radius-lg)",
          padding: 24, maxWidth: 760, width: "90%", maxHeight: "90vh", overflow: "auto",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>채용공고 수정</h3>
        <PostingFields values={values} onChange={setValues} errors={errors} />
        {posting.keywords.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="lbl" style={{ marginBottom: 6 }}>🤖 추출된 키워드</div>
            <KeywordChipList keywords={posting.keywords} limit={20} />
            <div className="helper">본문 텍스트 수정 시 다음 저장 때 키워드가 다시 추출돼요.</div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button className="btn ghost" onClick={handleDelete}
                  style={{ color: "var(--color-semantic-error)" }}>삭제</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" onClick={onClose}>취소</button>
            <button className="btn" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
