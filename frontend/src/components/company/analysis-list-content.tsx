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
    <section style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>기업분석</h2>
        <Link href="/company/analysis/new" className="btn">+ 새 기업분석</Link>
      </div>

      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}

      {items === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)" }}>
          아직 분석한 기업이 없어요. 첫 분석을 만들어보세요.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((it) => {
            const expired = it.expiresInDays < 0;
            return (
              <Link key={it.id} href={`/company/analysis/${it.id}`}
                style={{
                  display: "block",
                  padding: "14px 16px",
                  background: "var(--color-surface-default)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: "var(--radius-lg)",
                  textDecoration: "none",
                  color: "var(--color-text-primary)",
                }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{it.company}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
                  {it.generatedAt.slice(0, 10)} 생성 · {expired ? (
                    <span style={{ color: "var(--color-semantic-error)" }}>만료됨</span>
                  ) : (
                    <>D-{it.expiresInDays}</>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
