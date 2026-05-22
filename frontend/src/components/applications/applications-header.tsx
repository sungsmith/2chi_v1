"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ApplicationsHeader() {
  const pathname = usePathname();
  const onCalendar = pathname.startsWith("/applications/calendar");
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>지원 현황</h2>
      <div style={{ display: "flex", gap: 4 }}>
        <Link
          href="/applications"
          className={`btn ${onCalendar ? "ghost" : ""}`}
          style={{ fontSize: 13 }}
        >📋 대시보드</Link>
        <Link
          href="/applications/calendar"
          className={`btn ${onCalendar ? "" : "ghost"}`}
          style={{ fontSize: 13 }}
        >📅 캘린더</Link>
      </div>
    </div>
  );
}
