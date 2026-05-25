"use client";

import { SideNav } from "@/components/me/side-nav";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="me-shell">
      <SideNav />
      <main className="me-main">{children}</main>
    </div>
  );
}
