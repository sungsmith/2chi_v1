"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ITEM_TYPE_LABELS, ITEM_TYPE_ORDER, type ItemType } from "@/lib/types/cover-letter";

type Props = {
  postingId: number;
  postingCompany: string;
  onClose: () => void;
};

export function PostingCtaModal({ postingId, postingCompany, onClose }: Props) {
  const router = useRouter();
  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [charLimit, setCharLimit] = useState<string>("500");
  const [error, setError] = useState<string | undefined>();

  function handleSubmit() {
    if (!itemType) { setError("항목을 선택해주세요"); return; }
    const n = Number(charLimit);
    if (!Number.isInteger(n) || n <= 0) { setError("글자수는 0보다 큰 정수"); return; }
    router.push(`/cover-letters/variants/new?postingId=${postingId}&itemType=${itemType}&charLimit=${n}`);
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--color-surface-default)",
        borderRadius: "var(--radius-lg)",
        padding: 24, width: 480, maxWidth: "90vw",
      }}>
        <h3 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700 }}>
          {postingCompany} — 자소서 항목 선택
        </h3>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
          어떤 항목을 작성하시겠어요? AI 가 초안을 만들어드려요.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
          {ITEM_TYPE_ORDER.map((t) => {
            const active = t === itemType;
            return (
              <button key={t} onClick={() => setItemType(t)}
                      style={{
                        padding: "10px 12px",
                        border: `1px solid ${active ? "var(--color-primary-600)" : "var(--color-border-default)"}`,
                        borderRadius: "var(--radius-md)",
                        background: active ? "var(--color-primary-50)" : "var(--color-surface-default)",
                        color: active ? "var(--color-primary-700)" : "var(--color-text-primary)",
                        fontWeight: active ? 700 : 500, fontSize: 13,
                        cursor: "pointer", textAlign: "left",
                      }}>
                {ITEM_TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label className="lbl" htmlFor="cta-limit">글자수 제한</label>
          <input id="cta-limit" className="input" inputMode="numeric"
                 value={charLimit} onChange={(e) => setCharLimit(e.target.value)}
                 placeholder="500" />
          {error && <div className="helper error">{error}</div>}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn ghost" onClick={onClose}>취소</button>
          <button className="btn" onClick={handleSubmit}>작성 시작</button>
        </div>
      </div>
    </div>
  );
}
