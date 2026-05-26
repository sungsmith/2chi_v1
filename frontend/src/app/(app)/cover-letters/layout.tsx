"use client";

import { usePathname } from "next/navigation";
import { ClSubTabs } from "@/components/cover-letters/cl-sub-tabs";

export default function CoverLettersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  // editor route 진입 시 sub-tabs 비활성 (별도 화면)
  const inEditor = pathname.startsWith("/cover-letters/variants");
  return (
    <div className="cl-shell">
      {!inEditor && <ClSubTabs />}
      <div className="cl-main">{children}</div>
    </div>
  );
}
