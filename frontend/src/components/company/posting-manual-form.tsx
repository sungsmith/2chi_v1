"use client";

import { useState } from "react";
import { PostingFields, EMPTY_FORM_VALUES, validatePostingFields, type PostingFormValues, type PostingFormErrors } from "./posting-fields";
import type { JobPostingCreateRequest } from "@/lib/types/posting";

type Props = {
  initialValues?: Partial<PostingFormValues>;
  initialSourceUrl?: string;
  onSubmit: (req: JobPostingCreateRequest) => Promise<void>;
  onCancel?: () => void;
};

export function PostingManualForm({ initialValues = {}, initialSourceUrl, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<PostingFormValues>({ ...EMPTY_FORM_VALUES, ...initialValues });
  const [errors, setErrors] = useState<PostingFormErrors>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validatePostingFields(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({
        source: "MANUAL",
        company: values.company.trim(),
        title: values.title.trim(),
        jobRole: values.jobRole.trim() || null,
        deadline: values.deadline || null,
        mainTasks: values.mainTasks.trim() || null,
        requirements: values.requirements.trim() || null,
        preferred: values.preferred.trim() || null,
        sourceUrl: initialSourceUrl || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <PostingFields values={values} onChange={setValues} errors={errors} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>취소</button>}
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "저장 중…" : "저장 후 자소서 작성"}
        </button>
      </div>
    </form>
  );
}
