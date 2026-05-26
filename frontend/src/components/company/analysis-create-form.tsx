"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrReplaceAnalysis } from "@/lib/api/company-analysis";

type Props = {
  initialCompany?: string;
};

const IcoSearch = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IcoSparkle = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.09 6.26L20 12l-5.91 2.74L12 21l-2.09-6.26L4 12l5.91-2.74z"/>
  </svg>
);

const IcoArrowRight = ({ size = 13 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IcoInfo = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// Static DART candidate data (placeholder — live DART search in v2)
const DART_CANDIDATES = [
  { id: "c1", glyph: "카", nm: "주식회사 카카오", meta: ["IT · 모바일 플랫폼", "본사 경기 성남", "임직원 5,100명"], stock: "KOSPI 035720" },
  { id: "c2", glyph: "카", nm: "카카오게임즈",    meta: ["게임 · 모바일/PC",   "본사 경기 성남", "임직원 1,200명"], stock: "KOSDAQ 293490" },
  { id: "c3", glyph: "카", nm: "카카오페이",      meta: ["금융 · 간편결제",    "본사 서울",      "임직원 1,150명"], stock: "KOSPI 377300" },
];

export function AnalysisCreateForm({ initialCompany = "" }: Props) {
  const router = useRouter();
  const [company, setCompany] = useState(initialCompany);
  const [step, setStep] = useState<"search" | "candidates" | "empty">("search");
  const [picked, setPicked] = useState<string>("c1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit() {
    const companyName = step === "candidates"
      ? (DART_CANDIDATES.find((c) => c.id === picked)?.nm ?? company.trim())
      : company.trim();

    if (!companyName) { setError("회사명을 입력해주세요"); return; }
    setSubmitting(true);
    setError(undefined);
    try {
      const result = await createOrReplaceAnalysis({
        company: companyName,
        urls: [],
      });
      router.push(`/company/analysis/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 생성에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ca-entry">
      <section className="co-head">
        <div>
          <h1>새 회사 분석</h1>
          <div className="sub">분석할 회사명을 검색해주세요. DART · 뉴스 · 인재상을 한 번에 정리해드릴게요.</div>
        </div>
      </section>

      {error && (
        <div role="alert" style={{
          padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}

      <section className="ca-entry-card">
        <div className="head">
          <span className="lbl">회사명 <span className="req">*</span></span>
          <span className="sub">정확한 회사명이 좋아요 (예: &quot;카카오&quot;, &quot;(주)테크컴퍼니&quot;)</span>
        </div>
        <div className="ca-search-row">
          <label className="ca-search-field">
            <span className="ico"><IcoSearch size={16} /></span>
            <input
              id="acf-company"
              aria-label="회사명"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="회사명 검색…"
            />
          </label>
          <button className="ca-search-btn" type="button" onClick={() => setStep("candidates")}>
            <IcoSparkle size={14} /> 검색
          </button>
        </div>

        {step === "candidates" && (
          <>
            <div className="head" style={{ paddingTop: 4 }}>
              <span className="lbl">동명 기업 후보 · {DART_CANDIDATES.length}</span>
              <span className="sub">DART 등록된 사업자 기준</span>
            </div>
            <div className="ca-candidates">
              {DART_CANDIDATES.map((cand) => (
                <div
                  key={cand.id}
                  className={"ca-cand-row" + (picked === cand.id ? " selected" : "")}
                  onClick={() => setPicked(cand.id)}
                  role="radio"
                  aria-checked={picked === cand.id}
                >
                  <span className="co-glyph">{cand.glyph}</span>
                  <div className="body">
                    <span className="nm">{cand.nm}</span>
                    <span className="meta">
                      {cand.meta.map((m, i) => (
                        <span key={i}>{i > 0 && <span className="sep">·</span>}{m}</span>
                      ))}
                    </span>
                  </div>
                  <span className="stock">{cand.stock}</span>
                  <span className="pick-radio" />
                </div>
              ))}
            </div>
            <div className="ca-entry-foot">
              <span className="hint">맞는 회사가 없다면 직접 입력해주세요.</span>
              <button className="btn primary sm" type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "분석 시작 중…" : <><span>선택하고 분석 시작</span> <IcoArrowRight size={13} /></>}
              </button>
            </div>
          </>
        )}

        {step === "empty" && (
          <div className="ca-empty">
            <span className="ico">
              <IcoInfo />
            </span>
            <div className="body">
              <div className="ttl">정보가 제한적이에요</div>
              <div className="desc">DART에 등록된 정보가 없거나, 비상장 기업일 수 있어요. 직접 회사 정보를 입력하면 그대로 분석에 활용할게요.</div>
              <div className="actions">
                <button className="btn ghost sm" type="button" onClick={() => setStep("search")}>다시 검색</button>
                <button className="btn primary sm" type="button" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "분석 시작 중…" : "직접 입력하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "search" && (
          <div className="ca-entry-foot">
            <span className="hint" />
            <button className="btn primary sm" type="button" onClick={handleSubmit} disabled={submitting || !company.trim()}>
              {submitting ? "분석 시작 중…" : "분석 시작"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
