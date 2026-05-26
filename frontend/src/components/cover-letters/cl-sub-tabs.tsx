"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { id: "list" | "trash" | "career-statement"; label: string; href: string };

const TABS: Tab[] = [
  { id: "list",              label: "자소서",         href: "/cover-letters" },
  { id: "trash",             label: "휴지통",         href: "/cover-letters/trash" },
  { id: "career-statement",  label: "경력기술서 재구조화", href: "/cover-letters/career-statement" },
];

export function ClSubTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="sub-tabs" aria-label="자소서 sub-navigation">
      {TABS.map((tab) => {
        const active =
          tab.id === "list"
            ? pathname === "/cover-letters"
            : pathname.startsWith(tab.href);
        return (
          <Link key={tab.id} href={tab.href} className={`sub-tab${active ? " active" : ""}`}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
