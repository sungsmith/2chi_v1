"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAnalysis, createOrReplaceAnalysis } from "@/lib/api/company-analysis";
import type { CompanyAnalysis, AnalysisSummary } from "@/lib/types/company-analysis";

type Props = { id: number };

export function AnalysisDetailContent({ id }: Props) {
  const [analysis, setAnalysis] = useState<CompanyAnalysis | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchAnalysis(id)
      .then(setAnalysis)
      .catch((e) => setError(e instanceof Error ? e.message : "기업분석을 불러오지 못했어요."));
  }, [id]);

  async function handleRegenerate() {
    if (!analysis) return;
    setRegenerating(true);
    setError(undefined);
    try {
      const updated = await createOrReplaceAnalysis({
        company: analysis.company,
        urls: analysis.sourceUrls,
      });
      setAnalysis(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "재분석에 실패했어요.");
    } finally {
      setRegenerating(false);
    }
  }

  if (error) {
    return (
      <section style={{ padding: 32 }}>
        <div role="alert" style={{
          padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      </section>
    );
  }

  if (!analysis) {
    return <section style={{ padding: 32, color: "var(--color-text-secondary)" }}>불러오는 중…</section>;
  }

  const summary: AnalysisSummary = JSON.parse(analysis.summaryJson);
  const expired = analysis.expiresInDays < 0;

  return (
    <section style={{ padding: 32 }}>
      <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>
        기업분석 &gt; {analysis.company}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{analysis.company}</h2>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
            {analysis.generatedAt.slice(0, 10)} 생성 · {analysis.generatedBy} ·{" "}
            {expired ? (
              <span style={{ color: "var(--color-semantic-error)" }}>캐시 만료됨</span>
            ) : (
              <>D-{analysis.expiresInDays}</>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={handleRegenerate} disabled={regenerating} type="button">
            {regenerating ? "재분석 중…" : "🔄 재분석"}
          </button>
          <Link href="/cover-letters" className="btn">📝 자소서 작성</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl" style={{ marginBottom: 8 }}>🏢 회사 개요</div>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            <div><b>사업 영역:</b> {summary.overview.businessArea}</div>
            {summary.overview.mainProducts.length > 0 && (
              <div><b>주요 제품:</b> {summary.overview.mainProducts.join(", ")}</div>
            )}
            {summary.overview.revenue && <div><b>매출:</b> {summary.overview.revenue}</div>}
            {summary.overview.employees != null && <div><b>임직원:</b> {summary.overview.employees}명</div>}
            {summary.overview.location && <div><b>소재:</b> {summary.overview.location}</div>}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="lbl" style={{ marginBottom: 8 }}>👥 인재상</div>
          {summary.talent_profile.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              회사 홈페이지 URL 을 추가하면 인재상 키워드를 추출해요.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {summary.talent_profile.map((tag) => (
                <span key={tag} className="badge" style={{ fontSize: 12 }}>{tag}</span>
              ))}
            </div>
          )}
          {analysis.sourceUrls.length > 0 && (
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 8 }}>
              출처: {analysis.sourceUrls.length} 개 URL
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20, borderLeft: "4px solid var(--color-primary-600)" }}>
        <div className="lbl" style={{ marginBottom: 8 }}>💡 자소서·면접 활용 포인트</div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.9 }}>
          {summary.action_points.map((pt, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{pt}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
