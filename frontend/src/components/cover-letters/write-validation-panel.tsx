"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "@/components/ui/icons";

type Props = {
  userEdit: string;
  charLimit: number;
  postingKeywords: string[];
  postingCompany?: string;
  postingTitle?: string;
};

function useDebounced<T>(value: T, ms = 500): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function WriteValidationPanel({
  userEdit, charLimit, postingKeywords,
  postingCompany = "", postingTitle = "",
}: Props) {
  const debounced = useDebounced(userEdit, 500);
  const charCount = debounced.length;
  const ratio = charLimit > 0 ? charCount / charLimit : 0;

  const matched = postingKeywords.filter((kw) => kw && debounced.includes(kw));
  const gap = postingKeywords.filter((kw) => kw && !debounced.includes(kw));
  const matchOk = matched.length >= 3;

  return (
    <>
      {/* 연결된 공고 */}
      <section className="panel">
        <div className="panel-head"><h3>연결된 공고</h3></div>
        {postingCompany && (
          <div className="cl-meta-row"><span className="k">회사</span><span className="v">{postingCompany}</span></div>
        )}
        {postingTitle && (
          <div className="cl-meta-row"><span className="k">포지션</span><span className="v">{postingTitle}</span></div>
        )}
        <div className="cl-meta-row">
          <span className="k">글자 제한</span>
          <span className="v" style={{ color: ratio > 1 ? "var(--color-semantic-error)" : ratio >= 0.9 ? "var(--color-semantic-success)" : undefined }}>
            {charCount} / {charLimit}
          </span>
        </div>
        <div className="cl-meta-row">
          <span className="k">JD 키워드</span>
          <span className="v" style={{ color: matchOk ? "var(--color-mint-700)" : undefined }}>
            {matched.length} / {postingKeywords.length}{matchOk ? " · 기준 3개 충족" : ""}
          </span>
        </div>
      </section>

      {/* 매칭된 키워드 */}
      {matched.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h3 style={{ color: "var(--color-mint-700)" }}>
              매칭된 키워드 · {matched.length}
            </h3>
          </div>
          <div className="cl-kw-list">
            {matched.map((kw) => (
              <span key={kw} className="chip-keyword match">{kw}</span>
            ))}
          </div>
        </section>
      )}

      {/* 보완할 키워드 */}
      {gap.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h3 style={{ color: "var(--color-peach-400)" }}>
              보완할 키워드 · {gap.length}
            </h3>
          </div>
          <div className="cl-kw-list">
            {gap.map((kw) => (
              <span key={kw} className="chip-keyword gap">{kw}</span>
            ))}
          </div>
        </section>
      )}

      {/* AI 검증 — v2 예정 */}
      <section className="panel">
        <div className="panel-head">
          <h3 style={{ color: "var(--color-lavender-600)" }}>
            <Sparkle size={14} /> AI 검증
          </h3>
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          v2 예정 — 이력에서 확인되지 않은 표현 자동 감지
        </div>
      </section>
    </>
  );
}
