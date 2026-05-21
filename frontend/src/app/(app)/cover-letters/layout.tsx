"use client";

import { usePathname } from "next/navigation";
import { SidenavRail } from "@/components/company/sidenav-rail";

const ITEMS = [
  { href: "/cover-letters", label: "자소서" },
  { href: "/me/career", label: "경력기술서" },  // cross-category link
];

export default function CoverLettersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const activeHref = pathname.startsWith("/me/career")
    ? "/me/career"
    : "/cover-letters";
  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
      <SidenavRail category="이직 / 취업" items={ITEMS} activeHref={activeHref} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
