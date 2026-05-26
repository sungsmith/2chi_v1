"use client";

import { ApSideNav } from "@/components/applications/ap-side-nav";

export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ap-shell">
      <ApSideNav />
      <main className="ap-main">{children}</main>
    </div>
  );
}
