"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { id: string; label: string; href?: string; badge?: string };
type Section = { section: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    section: "기본 정보",
    items: [
      { id: "basic", label: "기초 정보" },
      { id: "edu",   label: "학력" },
      { id: "cert",  label: "자격증" },
      { id: "exp",   label: "경험 / 대외활동" },
    ],
  },
  {
    section: "경력 / 이력",
    items: [
      { id: "resume", label: "이력서" },
      { id: "career", label: "경력기술", href: "/me/career", badge: "PRAR" },
    ],
  },
  {
    section: "기타",
    items: [
      { id: "portfolio", label: "포트폴리오 링크" },
    ],
  },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        borderRight: "1px solid var(--color-border-default)",
        padding: "var(--space-6) var(--space-4)",
        background: "var(--color-surface-soft)",
        position: "sticky",
        top: 64,
        height: "calc(100vh - 64px)",
        overflowY: "auto",
      }}
    >
      {SECTIONS.map((sec) => (
        <div key={sec.section} style={{ marginBottom: "var(--space-6)" }}>
          <div style={{
            fontSize: "var(--fs-caption)",
            fontWeight: 700,
            color: "var(--color-text-secondary)",
            marginBottom: "var(--space-2)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}>
            {sec.section}
          </div>
          {sec.items.map((it) => {
            const active = it.href && pathname === it.href;
            if (it.href) {
              return (
                <Link
                  key={it.id}
                  href={it.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    background: active ? "var(--color-primary-50)" : "transparent",
                    color: active ? "var(--color-primary-700)" : "var(--color-text-primary)",
                    fontWeight: active ? 600 : 500,
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  {it.label}
                  {it.badge && (
                    <span style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "var(--color-primary-100)",
                      color: "var(--color-primary-700)",
                    }}>
                      {it.badge}
                    </span>
                  )}
                </Link>
              );
            }
            return (
              <div
                key={it.id}
                role="link"
                aria-disabled="true"
                title="준비중"
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text-muted)",
                  cursor: "not-allowed",
                  fontSize: 14,
                  fontWeight: 500,
                  opacity: 0.6,
                }}
              >
                {it.label}
              </div>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
