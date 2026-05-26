"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { id: "account" | "social" | "notifications" | "notification-center" | "withdraw"; label: string; href: string };

const MP_NAV: NavItem[] = [
  { id: "account",             label: "계정 정보",     href: "/mypage" },
  { id: "social",              label: "소셜 연결",     href: "/mypage/social" },
  { id: "notifications",       label: "알림 설정",     href: "/mypage/notifications" },
  { id: "notification-center", label: "알림 센터",     href: "/mypage/notification-center" },
  { id: "withdraw",            label: "회원 탈퇴",     href: "/mypage/withdraw" },
];

export function MpSideNav() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="side-nav">
      <div className="crumb">마이페이지</div>
      {MP_NAV.map((item) => {
        const active =
          item.href === "/mypage"
            ? pathname === "/mypage"
            : pathname.startsWith(item.href);
        return (
          <Link key={item.id} href={item.href} className={`nav-item${active ? " active" : ""}`}>
            <span className="label">{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
