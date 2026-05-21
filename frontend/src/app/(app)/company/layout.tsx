"use client";

import { usePathname } from "next/navigation";
import { SidenavRail } from "@/components/company/sidenav-rail";

const ITEMS = [
  { href: "/company/postings", label: "채용공고" },
  { href: "/company/analysis", label: "기업분석" },
];

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const activeHref = pathname.startsWith("/company/analysis")
    ? "/company/analysis"
    : "/company/postings";
  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
      <SidenavRail category="기업" items={ITEMS} activeHref={activeHref} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
