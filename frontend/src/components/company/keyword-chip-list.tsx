"use client";

type Props = { keywords: string[]; limit?: number };

export function KeywordChipList({ keywords, limit = 5 }: Props) {
  if (!keywords || keywords.length === 0) {
    return <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>—</span>;
  }
  const visible = keywords.slice(0, limit);
  const extra = keywords.length - visible.length;
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 6 }}>
      {visible.map((k) => (
        <span key={k} className="badge info">{k}</span>
      ))}
      {extra > 0 && (
        <span className="badge" style={{
          background: "var(--color-surface-muted)",
          color: "var(--color-text-secondary)"
        }}>+{extra}</span>
      )}
    </div>
  );
}
