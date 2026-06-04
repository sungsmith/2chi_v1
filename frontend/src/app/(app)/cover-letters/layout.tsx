"use client";

import { usePathname } from "next/navigation";
import { ClSideNav } from "@/components/cover-letters/cl-side-nav";

export default function CoverLettersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  // editor route 진입 시 side-nav 비활성 (별도 화면)
  const inEditor = pathname.startsWith("/cover-letters/variants");
  return (
    <div className="cl-shell">
      {!inEditor && <ClSideNav />}
      <div className="cl-main">{children}</div>
    </div>
  );
}
