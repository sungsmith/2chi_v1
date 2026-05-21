"use client";

type Props = {
  aiDraft: string;
  userEdit: string;
  onUserEditChange: (v: string) => void;
  aiModel: string | null;
  readOnly?: boolean;
};

export function WriteDualPane({ aiDraft, userEdit, onUserEditChange, aiModel, readOnly = false }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
      <div style={{
        background: "var(--color-surface-soft)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-md)",
        padding: 14,
      }}>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
          ⚪ AI 초안 (읽기 전용) · {aiDraft.length}자{aiModel ? ` · ${aiModel}` : ""}
        </div>
        <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7 }}>
          {aiDraft || "(아직 초안이 생성되지 않았어요)"}
        </div>
      </div>
      <div style={{
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-md)",
        padding: 14,
      }}>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>
          ✏️ 수정본 (편집 가능) · {userEdit.length}자
        </div>
        <textarea
          aria-label="자소서 수정본"
          className="textarea"
          rows={14}
          value={userEdit}
          onChange={(e) => onUserEditChange(e.target.value)}
          readOnly={readOnly}
          style={{ width: "100%", resize: "vertical", fontSize: 14, lineHeight: 1.7 }}
        />
      </div>
    </div>
  );
}
