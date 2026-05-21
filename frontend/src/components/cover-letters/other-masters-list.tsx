"use client";

import type { CoverLetterMasterSummary } from "@/lib/types/cover-letter";

type Props = {
  others: CoverLetterMasterSummary[];
  onSelect: (id: number) => void;
};

export function OtherMastersList({ others, onSelect }: Props) {
  if (others.length === 0) return null;

  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      background: "var(--color-surface-default)",
      border: "1px solid var(--color-border-default)",
      borderRadius: "var(--radius-lg)",
    }}>
      <div className="lbl" style={{ marginBottom: 8, color: "var(--color-text-muted)" }}>
        같은 항목 유형의 다른 마스터
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {others.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 14,
            }}
          >
            <span style={{ fontWeight: 500 }}>
              {m.title ?? "(제목 없음)"}
              {m.isDefault && <span style={{ marginLeft: 6 }}>⭐</span>}
            </span>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {m.charCount}자 · {m.updatedAt.slice(0, 10)} 수정
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
