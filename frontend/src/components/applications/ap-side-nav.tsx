"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { id: "calendar" | "kanban" | "history"; label: string; href: string };

const AP_NAV: NavItem[] = [
  { id: "calendar", label: "캘린더", href: "/applications/calendar" },
  { id: "kanban",   label: "칸반",   href: "/applications" },
  { id: "history",  label: "히스토리", href: "/applications/history" },
];

export function ApSideNav() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="side-nav">
      <div className="crumb">지원 현황</div>
      {AP_NAV.map((item) => {
        const active =
          item.href === "/applications"
            ? pathname === "/applications"
            : pathname.startsWith(item.href);
        return (
          <Link key={item.id} href={item.href} className={`nav-item${active ? " active" : ""}`}>
            <span className="label">{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
