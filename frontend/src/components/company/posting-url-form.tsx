"use client";

import { useState } from "react";
import { PostingFields, EMPTY_FORM_VALUES, validatePostingFields, type PostingFormValues, type PostingFormErrors } from "./posting-fields";
import { parsePosting } from "@/lib/api/posting";
import type { JobPostingCreateRequest } from "@/lib/types/posting";

type Props = {
  onSubmit: (req: JobPostingCreateRequest) => Promise<void>;
  onCancel?: () => void;
  onParseFailed: (reason: string, url: string) => void;  // → parent 가 manual 탭으로 전환 + URL 보존
};

export function PostingUrlForm({ onSubmit, onCancel, onParseFailed }: Props) {
  const [url, setUrl] = useState("");
  const [values, setValues] = useState<PostingFormValues>(EMPTY_FORM_VALUES);
  const [parsed, setParsed] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<PostingFormErrors>({});

  async function handleParse() {
    if (!url.trim()) return;
    setParsing(true);
    try {
      const r = await parsePosting(url.trim());
      setValues({
        company: r.company ?? "",
        title: r.title ?? "",
        jobRole: r.jobRole ?? "",
        deadline: r.deadline ?? "",
        mainTasks: r.mainTasks ?? "",
        requirements: r.requirements ?? "",
        preferred: r.preferred ?? "",
      });
      setParsed(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "자동 파싱이 안 되는 사이트예요. 직접 작성으로 입력해주세요.";
      onParseFailed(msg, url.trim());
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validatePostingFields(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({
        source: "URL",
        company: values.company.trim(),
        title: values.title.trim(),
        jobRole: values.jobRole.trim() || null,
        deadline: values.deadline || null,
        mainTasks: values.mainTasks.trim() || null,
        requirements: values.requirements.trim() || null,
        preferred: values.preferred.trim() || null,
        sourceUrl: url.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <div className="field">
        <label className="lbl" htmlFor="purl">채용공고 URL</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input id="purl" className="input" style={{ flex: 1 }}
                 value={url} onChange={(e) => setUrl(e.target.value)}
                 placeholder="https://www.saramin.co.kr/zf_user/jobs/..." />
          <button type="button" className="btn" disabled={parsing || !url.trim()}
                  onClick={handleParse}>{parsing ? "파싱 중…" : "파싱"}</button>
        </div>
        <div className="helper">사람인·잡코리아 공고의 회사명·제목·마감일을 자동으로 채워드려요. 본문은 직접 입력해주세요.</div>
      </div>
      {parsed && (
        <>
          <PostingFields values={values} onChange={setValues} errors={errors} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>취소</button>}
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "저장 중…" : "저장 후 자소서 작성"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
