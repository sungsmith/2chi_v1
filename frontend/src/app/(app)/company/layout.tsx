"use client";

import { CoSideNav } from "@/components/company/co-side-nav";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="co-shell">
      <CoSideNav />
      <main className="co-main">{children}</main>
    </div>
  );
}
