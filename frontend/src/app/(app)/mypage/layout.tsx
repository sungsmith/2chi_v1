"use client";

import { MpSideNav } from "@/components/mypage/mp-side-nav";

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mp-shell">
      <MpSideNav />
      <main className="mp-main">{children}</main>
    </div>
  );
}
