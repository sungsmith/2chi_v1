"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { id: "cl-list" | "cl-statement"; label: string; href: string; pill?: string; pillTitle?: string };

const CL_NAV: NavItem[] = [
  {
    id: "cl-list",
    label: "자소서",
    href: "/cover-letters",
    pill: "14",
    pillTitle: "휴지통 제외 자소서 전체 수",
  },
  { id: "cl-statement", label: "경력기술서", href: "/cover-letters/career-statement" },
];

export function ClSideNav() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="side-nav">
      <div className="crumb">이직 / 취업</div>
      {CL_NAV.map((item) => {
        const active =
          item.id === "cl-list"
            ? pathname === "/cover-letters" || pathname.startsWith("/cover-letters/trash")
            : pathname.startsWith(item.href);
        return (
          <Link key={item.id} href={item.href} className={`nav-item${active ? " active" : ""}`}>
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
