"use client";

import { SideNav } from "@/components/me/side-nav";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "calc(100vh - 64px)" }}>
      <SideNav />
      <main style={{ overflow: "auto" }}>{children}</main>
    </div>
  );
}
