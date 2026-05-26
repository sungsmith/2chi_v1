"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAnalyses } from "@/lib/api/company-analysis";
import type { CompanyAnalysisSummaryResponse } from "@/lib/types/company-analysis";

export function AnalysisListContent() {
  const [items, setItems] = useState<CompanyAnalysisSummaryResponse[] | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    fetchAnalyses()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "기업분석을 불러오지 못했어요."));
  }, []);

  return (
    <>
      <section className="co-head">
        <div>
          <h1>기업분석</h1>
          <div className="sub">DART · 뉴스 · 채용 페이지를 한 번에 정리한 회사별 카드를 모아둡니다.</div>
        </div>
        <Link href="/company/analysis/new" className="btn primary">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {" "}회사 분석 추가
        </Link>
      </section>

      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}

      <div className="posting-toolbar">
        <label className="search">
          <span className="ico">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input placeholder="회사명 검색…" readOnly />
        </label>
      </div>

      {items === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)" }}>
          아직 분석한 기업이 없어요. 첫 분석을 만들어보세요.
        </div>
      ) : (
        <div className="posting-table">
          <div className="posting-row head" style={{ gridTemplateColumns: "1fr 120px 100px 100px 80px 32px" }}>
            <div>회사</div>
            <div>분석</div>
            <div>매칭률</div>
            <div>연결 공고</div>
            <div />
            <div />
          </div>
          {items.map((it) => {
            const expired = it.expiresInDays < 0;
            const tagLabel = expired ? "만료됨" : `D-${it.expiresInDays}`;
            const fresh = it.expiresInDays >= 27;
            return (
              <Link
                key={it.id}
                href={`/company/analysis/${it.id}`}
                className="posting-row"
                style={{ gridTemplateColumns: "1fr 120px 100px 100px 80px 32px", display: "grid", textDecoration: "none", color: "inherit" }}
              >
                <div className="body">
                  <div className="nm">{it.company}</div>
                  <div className="meta">DART · 뉴스 · 인재상</div>
                </div>
                <div>
                  <span className={"src-pill " + (fresh ? "saramin" : "")}>{tagLabel}</span>
                </div>
                <div>
                  <span className="match-mini">
                    <span className="bar"><span style={{ width: "0%" }} /></span>
                    —
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-family-mono)", fontSize: 11, fontWeight: 700 }}>—</div>
                <div />
                <button className="more" onClick={(e) => e.stopPropagation()}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
