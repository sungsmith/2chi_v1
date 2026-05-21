"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENUS = [
  { href: "/", label: "대시보드" },
  { href: "/me", label: "내 정보" },
  { href: "/applications", label: "지원 현황" },
  { href: "/cover-letter", label: "이직 / 취업" },
  { href: "/company/postings", label: "기업" },
] as const;

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", gap: "var(--space-5)" }}>
      {MENUS.map((m) => {
        const active = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
        return (
          <Link
            key={m.href}
            href={m.href}
            style={{
              position: "relative",
              padding: "var(--space-2) 0",
              fontSize: "var(--fs-body-sm)",
              fontWeight: 600,
              color: active ? "var(--color-text-brand)" : "var(--color-text-secondary)",
              textDecoration: "none",
            }}
            aria-current={active ? "page" : undefined}
          >
            {m.label}
            {active && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 2,
                  background: "var(--color-primary-500)",
                  borderRadius: 1,
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
