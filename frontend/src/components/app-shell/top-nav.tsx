"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavMenu } from "./nav-menu";
import { NavIconButton } from "./nav-icon-button";
import { ProfileMenu } from "./profile-menu";

export function TopNav() {
  const router = useRouter();
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 64,
        background: "var(--color-surface-default)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 var(--space-6)",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-8)",
        }}
      >
        <Link
          href="/"
          aria-label="이취 (2chi)"
          style={{ display: "flex", alignItems: "center" }}
        >
          <img src="/logo.svg" alt="이취" style={{ height: 32 }} />
        </Link>

        <NavMenu />

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <NavIconButton
            ariaLabel="검색"
            onClick={() => alert("검색 기능은 곧 제공됩니다.")}
          >
            <SearchIcon />
          </NavIconButton>
          <NavIconButton
            ariaLabel="알림"
            onClick={() => router.push("/mypage/notification-center")}
          >
            <BellIcon />
          </NavIconButton>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={11} cy={11} r={7} />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
