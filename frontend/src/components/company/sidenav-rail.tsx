"use client";

import Link from "next/link";

export type SidenavRailItem = { href: string; label: string };

type Props = {
  category: string;
  items: SidenavRailItem[];
  activeHref: string;
};

export function SidenavRail({ category, items, activeHref }: Props) {
  return (
    <nav
      aria-label={`${category} 하위 메뉴`}
      style={{
        width: 240,
        borderRight: "1px solid var(--color-border-default)",
        background: "var(--color-surface-default)",
        padding: "24px 16px",
        flexShrink: 0,
      }}
    >
      <div style={{
        fontFamily: "var(--font-family-mono)",
        fontSize: 11,
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        marginBottom: 12,
        letterSpacing: "0.04em",
      }}>{category}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
        {items.map((it) => {
          const active = it.href === activeHref;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--color-primary)" : "var(--color-text-default)",
                  background: active ? "var(--color-primary-subtle)" : "transparent",
                  borderLeft: active ? "3px solid var(--color-primary)" : "3px solid transparent",
                  textDecoration: "none",
                }}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
