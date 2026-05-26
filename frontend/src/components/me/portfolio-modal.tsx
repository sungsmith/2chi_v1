"use client";

import { useState } from "react";

export type PortfolioLinkType =
  | "github"
  | "notion"
  | "behance"
  | "dribbble"
  | "figma"
  | "pdf"
  | "url"
  | "file";

type Props = {
  initialType?: PortfolioLinkType;
  onClose: () => void;
};

const LINK_TYPES: { id: PortfolioLinkType; lbl: string; glyph: string }[] = [
  { id: "github",   lbl: "GitHub",      glyph: "GH"  },
  { id: "notion",   lbl: "Notion",      glyph: "N"   },
  { id: "behance",  lbl: "Behance",     glyph: "Be"  },
  { id: "dribbble", lbl: "Dribbble",    glyph: "Dr"  },
  { id: "figma",    lbl: "Figma",       glyph: "Fg"  },
  { id: "pdf",      lbl: "PDF",         glyph: "PDF" },
  { id: "url",      lbl: "기타 URL",    glyph: "URL" },
  { id: "file",     lbl: "파일 업로드", glyph: "⬆"  },
];

export function PortfolioModal({ initialType = "github", onClose }: Props) {
  const [type, setType] = useState<PortfolioLinkType>(initialType);

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>포트폴리오 추가</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div className="fld">
            <label className="lbl">링크 종류 <span className="req">*</span></label>
            <div className="pf-type-grid">
              {LINK_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`pf-type-chip${type === t.id ? " active" : ""}`}
                  onClick={() => setType(t.id)}
                >
                  <span className="ico">{t.glyph}</span>
                  <span className="lbl">{t.lbl}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="fld">
            <label className="lbl">제목 <span className="req">*</span></label>
            <input className="input" placeholder="예: 식권 정산 API · 캐시 적중률 개선" />
          </div>

          <div className="fld">
            <label className="lbl">
              {type === "file" ? "파일 업로드" : "URL"} <span className="req">*</span>
            </label>
            <input
              className="input"
              placeholder={type === "file" ? "파일을 선택해주세요" : "https://…"}
            />
          </div>

          <div className="fld">
            <label className="lbl">한 줄 설명</label>
            <input className="input" placeholder="40자 이내 권장" />
          </div>

          <div className="fld">
            <label className="lbl">사용 기술</label>
            <div className="tagbox">
              <span className="tag">Spring Boot<button type="button" className="x">×</button></span>
              <span className="tag">Redis<button type="button" className="x">×</button></span>
              <input placeholder="태그 추가…" />
            </div>
            <span className="helper">Enter / 콤마(,)로 추가</span>
          </div>

          <div className="fld">
            <label className="lbl">본인 기여 요약</label>
            <textarea placeholder="예: API 캐시 적중률을 23% → 71%까지 끌어올려 평균 응답을 340ms → 110ms로 줄였습니다." />
          </div>
        </div>

        <footer className="foot">
          <button type="button" className="btn ghost sm" onClick={onClose}>
            취소
          </button>
          <button type="button" className="btn primary sm" onClick={onClose}>
            추가
          </button>
        </footer>
      </div>
    </div>
  );
}
