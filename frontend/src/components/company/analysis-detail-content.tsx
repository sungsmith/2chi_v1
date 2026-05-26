"use client";

import { useEffect, useState } from "react";
import { fetchAnalysis, createOrReplaceAnalysis } from "@/lib/api/company-analysis";
import type { CompanyAnalysis, AnalysisSummary } from "@/lib/types/company-analysis";

const Ico = {
  Building: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10M9 7h.01M12 7h.01M15 7h.01M9 11h.01M15 11h.01"/>
    </svg>
  ),
  Target: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Sparkle: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
    </svg>
  ),
  Refresh: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/>
    </svg>
  ),
  Link: ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  ),
};

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
  const freshLabel = expired ? "캐시 만료됨" : `분석 완료 · D-${analysis.expiresInDays}`;

  return (
    <div className="ca-shell">
      {/* Header card */}
      <div className="ca-head-card">
        <span className="icon"><Ico.Building size={22}/></span>
        <div className="body">
          <div className="co">{analysis.company}</div>
          <div className="meta">
            <span>{analysis.generatedAt.slice(0, 10)} 생성 · {analysis.generatedBy}</span>
            <span className={`pill${expired ? "" : " fresh"}`}>{freshLabel}</span>
          </div>
        </div>
        <div className="actions">
          <button
            className="btn ghost sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            type="button"
          >
            <Ico.Refresh size={12}/> {regenerating ? "재분석 중…" : "다시 분석"}
          </button>
        </div>
      </div>

      <div className="ca-grid">
        {/* LEFT — main content */}
        <div className="ca-col">
          {/* 회사 개요 */}
          <section className="ca-card">
            <div className="ca-card-head">
              <span className="ttl">
                <span className="ico"><Ico.Building size={14}/></span>회사 개요
              </span>
              <span className="src">사업보고서 · DART</span>
            </div>
            <div className="ca-card-body">
              {summary.overview.businessArea && (
                <p><b>사업 영역:</b> {summary.overview.businessArea}</p>
              )}
              {summary.overview.mainProducts.length > 0 && (
                <p><b>주요 제품:</b> {summary.overview.mainProducts.join(", ")}</p>
              )}
              {summary.overview.location && (
                <p><b>소재:</b> {summary.overview.location}</p>
              )}
            </div>
            {(summary.overview.revenue != null || summary.overview.employees != null) && (
              <div className="ca-stat-row">
                {summary.overview.revenue && (
                  <div className="stat"><span className="k">매출</span><span className="v">{summary.overview.revenue}</span></div>
                )}
                {summary.overview.employees != null && (
                  <div className="stat"><span className="k">임직원</span><span className="v">{summary.overview.employees}명</span></div>
                )}
              </div>
            )}
          </section>

          {/* 인재상 · 핵심 키워드 */}
          <section className="ca-card">
            <div className="ca-card-head">
              <span className="ttl peach">
                <span className="ico"><Ico.Target size={13}/></span>인재상 · 핵심 키워드
              </span>
              <span className="src">
                {analysis.sourceUrls.length > 0 ? `${analysis.sourceUrls.length}개 URL 분석` : "채용 페이지"}
              </span>
            </div>
            {summary.talent_profile.length === 0 ? (
              <div className="ca-card-body" style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                회사 홈페이지 URL 을 추가하면 인재상 키워드를 추출해요.
              </div>
            ) : (
              <div className="ca-keywords">
                {summary.talent_profile.map((tag) => (
                  <span key={tag} className="ca-keyword">{tag}</span>
                ))}
              </div>
            )}
          </section>

          {/* 자소서·면접 활용 포인트 */}
          <section className="ca-card">
            <div className="ca-card-head">
              <span className="ttl lav">
                <span className="ico"><Ico.Sparkle size={13}/></span>자소서 · 면접 활용 포인트
              </span>
              <span className="src">AI · 검토 권장</span>
            </div>
            {summary.action_points.length === 0 ? (
              <div className="ca-card-body" style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                분석 결과에서 활용 포인트를 추출하지 못했어요.
              </div>
            ) : (
              <div>
                {summary.action_points.map((pt, i) => (
                  <div key={i} className="ca-action">
                    <span className="num">{i + 1}</span>
                    <div className="body">
                      <div className="msg">{pt}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT — rail */}
        <aside className="ca-col">
          {/* 데이터 소스 */}
          <section className="ca-rail-card">
            <span className="rail-ttl">데이터 소스</span>
            <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              <div>· DART 사업보고서</div>
              {analysis.sourceUrls.length === 0 ? (
                <div>· 사용자 URL 없음</div>
              ) : (
                analysis.sourceUrls.map((url, i) => (
                  <div key={i}>· {url}</div>
                ))
              )}
            </div>
          </section>

          {/* 생성 정보 */}
          <section className="ca-rail-card">
            <span className="rail-ttl">생성 정보</span>
            <div className="ca-rail-row">
              <span className="k">생성일</span>
              <span className="v">{analysis.generatedAt.slice(0, 10)}</span>
            </div>
            <div className="ca-rail-row">
              <span className="k">모델</span>
              <span className="v">{analysis.generatedBy}</span>
            </div>
            <div className="ca-rail-row">
              <span className="k">캐시</span>
              <span className={`v${expired ? "" : " up"}`}>
                {expired ? "만료됨" : `D-${analysis.expiresInDays}`}
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
