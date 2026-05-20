"use client";

import { useState } from "react";
import { DateInput } from "./date-input";
import type { ProjectCreateRequest } from "@/lib/types/career";

type Props = {
  onSubmit: (req: ProjectCreateRequest) => Promise<void>;
  onCancel: () => void;
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

type Errors = { title?: string; periodStart?: string; periodEnd?: string };

export function NewProjectForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  function validate(): Errors {
    const e: Errors = {};
    if (!title.trim()) e.title = "프로젝트 이름을 입력해주세요";
    if (periodStart && !ISO_RE.test(periodStart)) e.periodStart = "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)";
    if (periodEnd && !ISO_RE.test(periodEnd)) e.periodEnd = "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        periodStart: periodStart || null,
        periodEnd: periodEnd || null,
        role: role.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
      onKeyDown={onKeyDown}
      style={{
        marginTop: 8, padding: 16,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        display: "grid", gap: 12,
      }}
    >
      <div className="field">
        <label className="lbl" htmlFor="np-title">프로젝트 이름<span className="req">*</span></label>
        <input
          id="np-title"
          className={`input${errors.title ? " error" : ""}`}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 주문 정산 시스템"
        />
        {errors.title && <div className="helper error">{errors.title}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="np-start">시작일</label>
          <DateInput id="np-start" value={periodStart} onChange={setPeriodStart} error={errors.periodStart} />
          {errors.periodStart && <div className="helper error">{errors.periodStart}</div>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="np-end">종료일</label>
          <DateInput id="np-end" value={periodEnd} onChange={setPeriodEnd} error={errors.periodEnd} />
          {errors.periodEnd && <div className="helper error">{errors.periodEnd}</div>}
        </div>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="np-role">역할</label>
        <input
          id="np-role"
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="예) BE 리드"
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
