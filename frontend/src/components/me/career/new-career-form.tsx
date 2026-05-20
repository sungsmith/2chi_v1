"use client";

import { useState } from "react";
import { DateInput } from "./date-input";
import type { CareerCreateRequest } from "@/lib/types/career";

type Props = {
  onSubmit: (req: CareerCreateRequest) => Promise<void>;
  onCancel: () => void;
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

type Errors = { company?: string; startDate?: string; endDate?: string };

export function NewCareerForm({ onSubmit, onCancel }: Props) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  function validate(): Errors {
    const e: Errors = {};
    if (!company.trim()) e.company = "회사명을 입력해주세요";
    if (!startDate) e.startDate = "시작일을 입력해주세요";
    else if (!ISO_RE.test(startDate)) e.startDate = "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)";
    if (endDate && !ISO_RE.test(endDate)) e.endDate = "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({
        company: company.trim(),
        position: position.trim() || undefined,
        startDate,
        endDate: endDate || null,
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
        marginTop: 12, padding: 16,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        display: "grid", gap: 12,
      }}
    >
      <div className="field">
        <label className="lbl" htmlFor="nc-company">회사명<span className="req">*</span></label>
        <input
          id="nc-company"
          className={`input${errors.company ? " error" : ""}`}
          autoFocus
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="(주)예시"
        />
        {errors.company && <div className="helper error">{errors.company}</div>}
      </div>
      <div className="field">
        <label className="lbl" htmlFor="nc-position">직책</label>
        <input
          id="nc-position"
          className="input"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="백엔드 개발자"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="nc-start">시작일<span className="req">*</span></label>
          <DateInput id="nc-start" value={startDate} onChange={setStartDate} error={errors.startDate} />
          {errors.startDate && <div className="helper error">{errors.startDate}</div>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="nc-end">종료일</label>
          <DateInput id="nc-end" value={endDate} onChange={setEndDate} error={errors.endDate} />
          <div className="helper">재직 중이면 비워두세요</div>
          {errors.endDate && <div className="helper error">{errors.endDate}</div>}
        </div>
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
