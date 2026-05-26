"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  id: "profile" | "career" | "portfolio";
  label: string;
  href: string;
  pill?: string;
  pillTitle?: string;
};

const ME_NAV: NavItem[] = [
  { id: "profile",   label: "내 정보",   href: "/me" },
  { id: "career",    label: "경력기술",  href: "/me/career", pill: "PRAR", pillTitle: "입력 구조: Problem · Root cause · Approach · Result" },
  { id: "portfolio", label: "포트폴리오", href: "/me/portfolio" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="side-nav">
      {ME_NAV.map((item) => {
        const active =
          item.href === "/me"
            ? pathname === "/me"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`nav-item${active ? " active" : ""}`}
          >
            <span className="label">{item.label}</span>
            {item.pill && (
              <span className="pill" title={item.pillTitle}>
                {item.pill}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}
