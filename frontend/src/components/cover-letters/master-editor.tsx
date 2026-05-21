"use client";

import { useState } from "react";
import { ITEM_TYPE_LABELS, type CoverLetterMaster, type ItemType, type MasterRequest } from "@/lib/types/cover-letter";

type Props = {
  itemType: ItemType;
  master: CoverLetterMaster | null;
  defaultExistsForType: boolean;
  onSave: (req: MasterRequest, patchOnly: boolean) => Promise<void>;
  onCancel: () => void;
  onSetDefault: () => Promise<void>;
  onUnsetDefault: () => Promise<void>;
  onCopy: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function MasterEditor({
  itemType, master, defaultExistsForType,
  onSave, onCancel, onSetDefault, onUnsetDefault, onCopy, onDelete,
}: Props) {
  const isNew = master === null;
  const [title, setTitle] = useState<string>(master?.title ?? "");
  const [masterAnswer, setMasterAnswer] = useState<string>(master?.masterAnswer ?? "");
  const [charLimitHint, setCharLimitHint] = useState<string>(
    master?.charLimitHint != null ? String(master.charLimitHint) : ""
  );
  const [isDefault, setIsDefault] = useState<boolean>(
    isNew ? !defaultExistsForType : master.isDefault
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSave() {
    if (!masterAnswer.trim()) {
      setError("답변을 입력해주세요");
      return;
    }
    const limit = charLimitHint.trim() === "" ? null : Number(charLimitHint);
    if (limit !== null && (!Number.isInteger(limit) || limit <= 0)) {
      setError("글자수는 0보다 큰 정수여야 해요");
      return;
    }
    setSaving(true);
    try {
      const req: MasterRequest = {
        itemType,
        title: title.trim() || null,
        masterAnswer: masterAnswer.trim(),
        charLimitHint: limit,
        isDefault,
      };
      await onSave(req, !isNew);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{
      padding: 20,
      background: "var(--color-surface-default)",
      border: "1px solid var(--color-border-default)",
      borderRadius: "var(--radius-lg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            항목 유형: {ITEM_TYPE_LABELS[itemType]}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {title || (isNew ? "새 마스터" : "(제목 없음)")}
            {master?.isDefault && <span style={{ marginLeft: 6 }}>⭐ 기본</span>}
          </div>
        </div>
        {!isNew && (
          <div style={{ display: "flex", gap: 6 }}>
            {master.isDefault ? (
              <button className="btn ghost" onClick={onUnsetDefault}>기본 해제</button>
            ) : (
              <button className="btn ghost" onClick={onSetDefault}>기본으로 설정</button>
            )}
            <button className="btn ghost" onClick={onCopy}>복사</button>
            <button className="btn ghost" onClick={onDelete}
                    style={{ color: "var(--color-semantic-error)" }}>삭제</button>
          </div>
        )}
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--color-border-subtle)", margin: "12px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div className="field">
          <label className="lbl" htmlFor="me-title">제목 (선택)</label>
          <input id="me-title" className="input"
                 value={title} onChange={(e) => setTitle(e.target.value)}
                 placeholder="A형 - 정량 성과 중심" />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="me-limit">타겟 글자수 힌트</label>
          <input id="me-limit" className="input" inputMode="numeric"
                 value={charLimitHint} onChange={(e) => setCharLimitHint(e.target.value)}
                 placeholder="500" />
        </div>
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label className="lbl" htmlFor="me-answer">마스터 답변 (PRAR 구조 권장)</label>
        <textarea id="me-answer" className={`textarea${error?.includes("답변") ? " error" : ""}`}
                  rows={10}
                  value={masterAnswer} onChange={(e) => setMasterAnswer(e.target.value)}
                  placeholder="저는 백엔드 개발자로서…" />
        <div className="helper">
          {masterAnswer.length}자
          {charLimitHint && ` / ${charLimitHint}자 목표`}
        </div>
        {error && <div className="helper error">{error}</div>}
      </div>

      {isNew && (
        <div className="field" style={{ marginBottom: 12 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            기본 마스터로 설정
          </label>
          {defaultExistsForType && isDefault && (
            <div className="helper">기존 기본 마스터의 기본 표시가 자동 해제돼요.</div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        {isNew && <button className="btn ghost" onClick={onCancel}>취소</button>}
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}
