"use client";

import { DateInput } from "../me/career/date-input";

export type PostingFormValues = {
  company: string;
  title: string;
  jobRole: string;
  deadline: string;
  mainTasks: string;
  requirements: string;
  preferred: string;
};

export type PostingFormErrors = Partial<Record<keyof PostingFormValues, string>>;

type Props = {
  values: PostingFormValues;
  onChange: (next: PostingFormValues) => void;
  errors?: PostingFormErrors;
};

export function PostingFields({ values, onChange, errors = {} }: Props) {
  function set<K extends keyof PostingFormValues>(k: K, v: PostingFormValues[K]) {
    onChange({ ...values, [k]: v });
  }
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="pf-company">회사명<span className="req">*</span></label>
          <input id="pf-company" className={`input${errors.company ? " error" : ""}`}
                 value={values.company} onChange={(e) => set("company", e.target.value)}
                 placeholder="(주)예시" />
          {errors.company && <div className="helper error">{errors.company}</div>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="pf-title">공고 제목<span className="req">*</span></label>
          <input id="pf-title" className={`input${errors.title ? " error" : ""}`}
                 value={values.title} onChange={(e) => set("title", e.target.value)}
                 placeholder="백엔드 개발자 (경력 2~5년)" />
          {errors.title && <div className="helper error">{errors.title}</div>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="pf-role">직무</label>
          <input id="pf-role" className="input"
                 value={values.jobRole} onChange={(e) => set("jobRole", e.target.value)}
                 placeholder="백엔드 개발자" />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="pf-deadline">마감일</label>
          <DateInput id="pf-deadline" value={values.deadline}
                     onChange={(v) => set("deadline", v)} error={errors.deadline} />
          {errors.deadline && <div className="helper error">{errors.deadline}</div>}
        </div>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="pf-tasks">주요 업무</label>
        <textarea id="pf-tasks" className={`textarea${errors.mainTasks ? " error" : ""}`}
                  rows={5} value={values.mainTasks}
                  onChange={(e) => set("mainTasks", e.target.value)}
                  placeholder="· 결제·정산 시스템 백엔드 개발…" />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="pf-req">자격 요건</label>
        <textarea id="pf-req" className={`textarea${errors.requirements ? " error" : ""}`}
                  rows={5} value={values.requirements}
                  onChange={(e) => set("requirements", e.target.value)}
                  placeholder="· Java / Spring Boot 2년 이상…" />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="pf-pref">우대 사항</label>
        <textarea id="pf-pref" className={`textarea${errors.preferred ? " error" : ""}`}
                  rows={4} value={values.preferred}
                  onChange={(e) => set("preferred", e.target.value)}
                  placeholder="· Kafka / MSA 경험…" />
      </div>
    </div>
  );
}

export const EMPTY_FORM_VALUES: PostingFormValues = {
  company: "", title: "", jobRole: "", deadline: "",
  mainTasks: "", requirements: "", preferred: "",
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePostingFields(v: PostingFormValues): PostingFormErrors {
  const e: PostingFormErrors = {};
  if (!v.company.trim()) e.company = "회사명을 입력해주세요";
  if (!v.title.trim()) e.title = "공고 제목을 입력해주세요";
  if (v.deadline && !ISO_RE.test(v.deadline)) e.deadline = "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)";
  return e;
}
