// DEPRECATED: 5.6 마스터 자소서 v1 폐기. 사용자 진입은 /cover-letters 로 redirect.
// BE 인프라(encryptor·entity·service)는 보존. v2/v3 의 "잘된 자소서 저장" 에서 재활용 후보.
"use client";

import { ITEM_TYPE_LABELS, ITEM_TYPE_ORDER, type ItemType } from "@/lib/types/cover-letter";

type Props = {
  counts: Record<ItemType, number>;
  activeType: ItemType;
  onSelect: (t: ItemType) => void;
  onAddMaster: () => void;
};

export function ItemTypeList({ counts, activeType, onSelect, onAddMaster }: Props) {
  return (
    <div style={{ width: 260, flexShrink: 0 }}>
      <div className="lbl" style={{ marginBottom: 8 }}>항목 유형</div>
      <div style={{
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}>
        {ITEM_TYPE_ORDER.map((t, i) => {
          const isActive = t === activeType;
          const count = counts[t] ?? 0;
          return (
            <button
              key={t}
              onClick={() => onSelect(t)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                border: "none",
                borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)",
                background: isActive ? "var(--color-primary-50)" : "transparent",
                color: isActive ? "var(--color-primary-700)" : "var(--color-text-primary)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>{ITEM_TYPE_LABELS[t]}</span>
              <span className="badge" style={{ fontSize: 11, padding: "1px 6px" }}>{count}</span>
            </button>
          );
        })}
      </div>
      <button className="btn ghost" onClick={onAddMaster}
              style={{ display: "block", width: "100%", marginTop: 10, textAlign: "center" }}>
        + 마스터 새로 만들기
      </button>
    </div>
  );
}
