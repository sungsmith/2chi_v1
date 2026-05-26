"use client";

import { Check, Refresh, Sparkle } from "@/components/ui/icons";

type Props = {
  aiDraft: string;
  userEdit: string;
  onUserEditChange: (v: string) => void;
  aiModel: string | null;
  readOnly?: boolean;
};

export function WriteDualPane({ aiDraft, userEdit, onUserEditChange, aiModel, readOnly = false }: Props) {
  const charCount = userEdit.length;

  return (
    <article className="cl-q">
      <div className="q-head">
        <span className="q-title">AI 초안 · 수정본</span>
        {aiModel && (
          <span className="badge lav dot">{aiModel}</span>
        )}
      </div>

      {/* AI 초안 (읽기 전용) */}
      <div className="q-prompt">
        <span style={{ fontSize: 11, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>
          AI 초안 · 읽기 전용 · {aiDraft.length}자
        </span>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "var(--color-text-primary)" }}>
          {aiDraft || "(아직 초안이 생성되지 않았어요)"}
        </div>
      </div>

      {/* 수정본 editor */}
      <textarea
        aria-label="자소서 수정본"
        className="editor"
        rows={10}
        value={userEdit}
        onChange={(e) => onUserEditChange(e.target.value)}
        readOnly={readOnly}
        style={{ width: "100%", resize: "vertical" }}
      />

      <div className="q-foot">
        <div className="counter">
          <button type="button" className="counter-toggle">
            <Check size={10} /> 공백 포함
          </button>
          <span className="count-text"><b>{charCount}</b> 자</span>
        </div>
        <div className="q-actions">
          <button type="button" className="btn ghost sm"><Refresh size={12} /> 다시 쓰기</button>
          <button type="button" className="btn secondary sm">맞춤법 검사</button>
          <button type="button" className="btn tertiary sm"><Sparkle size={12} /> 자소서 톤 맞추기</button>
        </div>
      </div>
    </article>
  );
}
