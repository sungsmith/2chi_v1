"use client";

export type PostingTab = "url" | "manual" | "search";

type Props = {
  active: PostingTab;
  onChange: (t: PostingTab) => void;
};

export function PostingTabs({ active, onChange }: Props) {
  const tabs: { id: PostingTab; label: string; disabled?: boolean; badge?: string }[] = [
    { id: "url", label: "🔗 URL 붙여넣기" },
    { id: "manual", label: "✏️ 직접 작성" },
    { id: "search", label: "🔍 검색", disabled: true, badge: "v2" },
  ];
  return (
    <div role="tablist" style={{
      display: "flex", gap: 0,
      borderBottom: "1px solid var(--color-border-default)",
      marginBottom: 16,
    }}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            disabled={t.disabled}
            onClick={() => !t.disabled && onChange(t.id)}
            style={{
              padding: "10px 18px",
              border: "none",
              background: isActive ? "var(--color-primary)" : "transparent",
              color: isActive ? "var(--color-on-primary)" : t.disabled ? "var(--color-text-muted)" : "var(--color-text-default)",
              borderRadius: "6px 6px 0 0",
              cursor: t.disabled ? "not-allowed" : "pointer",
              fontWeight: isActive ? 700 : 500,
              fontSize: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.label}
            {t.badge && (
              <span className="badge" style={{ fontSize: 10, padding: "1px 5px" }}>{t.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
