"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UrlInputList } from "./url-input-list";
import { createOrReplaceAnalysis } from "@/lib/api/company-analysis";

type Props = {
  initialCompany?: string;
};

export function AnalysisCreateForm({ initialCompany = "" }: Props) {
  const router = useRouter();
  const [company, setCompany] = useState(initialCompany);
  const [urls, setUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit() {
    if (!company.trim()) { setError("회사명을 입력해주세요"); return; }
    setSubmitting(true);
    setError(undefined);
    try {
      const result = await createOrReplaceAnalysis({
        company: company.trim(),
        urls: urls.filter((u) => u.trim().length > 0),
      });
      router.push(`/company/analysis/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 생성에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ padding: 32, maxWidth: 720 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>새 기업분석</h2>

      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}

      <div className="field" style={{ marginBottom: 20 }}>
        <label className="lbl" htmlFor="acf-company">회사명 *</label>
        <input id="acf-company" className="input"
          value={company} onChange={(e) => setCompany(e.target.value)}
          placeholder="(주)테크컴퍼니" />
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <label className="lbl">회사 홈페이지 URL (선택, 최대 5개)</label>
        <div className="helper" style={{ marginBottom: 8 }}>
          인재상·핵심 가치 페이지 URL 을 추가하면 AI 가 키워드를 추출해요.
        </div>
        <UrlInputList urls={urls} onChange={setUrls} max={5} />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn ghost" onClick={() => router.back()} type="button">취소</button>
        <button className="btn" onClick={handleSubmit} disabled={submitting} type="button">
          {submitting ? "분석 생성 중…" : "🏢 분석 생성"}
        </button>
      </div>
    </section>
  );
}
