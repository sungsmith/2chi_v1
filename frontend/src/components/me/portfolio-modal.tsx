"use client";

import { useState } from "react";
import { createPortfolioLink, updatePortfolioLink } from "@/lib/api/portfolio";
import type { PortfolioLink, PortfolioLinkKind } from "@/lib/types/me-portfolio";

type Props = {
  initial?: PortfolioLink;       // 있으면 편집 모드
  onClose: () => void;
  onSaved: () => void;           // 저장 성공 후 목록 갱신용
};

const KINDS: { id: PortfolioLinkKind; lbl: string; glyph: string }[] = [
  { id: "GITHUB", lbl: "GitHub", glyph: "GH" },
  { id: "BLOG",   lbl: "블로그", glyph: "B"  },
  { id: "NOTION", lbl: "Notion", glyph: "N"  },
  { id: "OTHER",  lbl: "기타 URL", glyph: "URL" },
];

export function PortfolioModal({ initial, onClose, onSaved }: Props) {
  const [kind, setKind] = useState<PortfolioLinkKind>(initial?.kind ?? "GITHUB");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const canSave = title.trim() !== "" && /^https?:\/\/.+/.test(url.trim());

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      const req = { kind, title: title.trim(), url: url.trim() };
      if (initial) await updatePortfolioLink(initial.id, req);
      else await createPortfolioLink(req);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
      setSaving(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>{initial ? "링크 편집" : "포트폴리오 링크 추가"}</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div className="fld">
            <label className="lbl">종류 <span className="req">*</span></label>
            <div className="pf-type-grid">
              {KINDS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`pf-type-chip${kind === t.id ? " active" : ""}`}
                  onClick={() => setKind(t.id)}
                >
                  <span className="ico">{t.glyph}</span>
                  <span className="lbl">{t.lbl}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="fld">
            <label className="lbl">제목 <span className="req">*</span></label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="예: 내 GitHub" />
          </div>

          <div className="fld">
            <label className="lbl">URL <span className="req">*</span></label>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>

          {error && <div role="alert" style={{ color: "var(--color-semantic-error)", fontSize: 13 }}>{error}</div>}
        </div>

        <footer className="foot">
          <button type="button" className="btn ghost sm" onClick={onClose}>취소</button>
          <button type="button" className="btn primary sm" onClick={handleSave} disabled={!canSave || saving}>
            {initial ? "저장" : "추가"}
          </button>
        </footer>
      </div>
    </div>
  );
}
