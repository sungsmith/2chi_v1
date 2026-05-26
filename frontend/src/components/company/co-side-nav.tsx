"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { id: "postings" | "analysis"; label: string; href: string; pill?: string; pillTitle?: string };

const CO_NAV: NavItem[] = [
  { id: "postings", label: "채용공고", href: "/company/postings", pill: "—", pillTitle: "마감되지 않은 진행중 공고 수 (실제 데이터 연동 시 갱신)" },
  { id: "analysis", label: "기업분석", href: "/company/analysis" },
];

export function CoSideNav() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="side-nav">
      <div className="crumb">기업</div>
      {CO_NAV.map((item) => {
        const active = pathname.startsWith(item.href);
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
