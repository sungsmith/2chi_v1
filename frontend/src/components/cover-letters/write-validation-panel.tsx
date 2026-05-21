"use client";

import { useEffect, useState } from "react";

type Props = {
  userEdit: string;
  charLimit: number;
  postingKeywords: string[];
};

function useDebounced<T>(value: T, ms = 500): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function WriteValidationPanel({ userEdit, charLimit, postingKeywords }: Props) {
  const debounced = useDebounced(userEdit, 500);
  const charCount = debounced.length;
  const ratio = charLimit > 0 ? charCount / charLimit : 0;
  const charColor =
    ratio < 0.9 ? "var(--color-text-muted)" :
    ratio <= 1.0 ? "var(--color-semantic-success)" :
    ratio <= 1.1 ? "var(--color-semantic-warning)" :
                    "var(--color-semantic-error)";

  const matched = postingKeywords.filter((kw) => kw && debounced.includes(kw));
  const matchOk = matched.length >= 3;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
      <div className="card" style={{ padding: 12 }}>
        <div className="lbl">✓ 자동 검증</div>
        <div style={{ fontSize: 13, marginTop: 6, color: charColor }}>
          글자수: {charCount} / {charLimit} {ratio >= 0.9 && ratio <= 1.0 ? "OK" : ""}
        </div>
        <div style={{ fontSize: 13, marginTop: 4, color: matchOk ? "var(--color-semantic-success)" : "var(--color-text-muted)" }}>
          JD 키워드: {matched.length} / {postingKeywords.length}{matchOk ? " · 기준 3개 충족" : ""}
        </div>
        {matched.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {matched.map((kw) => (
              <span key={kw} className="badge" style={{ fontSize: 11 }}>{kw}</span>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 12, opacity: 0.5 }}>
        <div className="lbl">⚠️ 거짓 방지 검토</div>
        <div style={{ fontSize: 12, marginTop: 6, color: "var(--color-text-muted)" }}>v2 예정</div>
      </div>

      <div className="card" style={{ padding: 12, opacity: 0.5 }}>
        <div className="lbl">📝 맞춤법</div>
        <div style={{ fontSize: 12, marginTop: 6, color: "var(--color-text-muted)" }}>v2 예정</div>
      </div>
    </div>
  );
}
