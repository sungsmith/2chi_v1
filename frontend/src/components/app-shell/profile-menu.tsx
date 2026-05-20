"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.push("/login");
  }

  const initial = user.nickname.charAt(0);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "var(--space-2) var(--space-3)",
          background: "transparent",
          border: "none",
          borderRadius: "var(--radius-full)",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-full)",
            background: "var(--color-primary-100)",
            color: "var(--color-text-brand)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--fs-body-sm)",
            fontWeight: 700,
          }}
        >
          {initial}
        </span>
        <span style={{ fontSize: "var(--fs-body-sm)", color: "var(--color-text-primary)" }}>
          {user.nickname}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            minWidth: 180,
            background: "var(--color-surface-default)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-floating)",
            padding: "var(--space-2)",
            zIndex: 60,
          }}
        >
          <Link
            href="/me"
            role="menuitem"
            onClick={() => setOpen(false)}
            style={menuItemStyle}
          >
            마이페이지
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            style={{
              ...menuItemStyle,
              width: "100%",
              textAlign: "left",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  padding: "var(--space-2) var(--space-3)",
  fontSize: "var(--fs-body-sm)",
  color: "var(--color-text-primary)",
  borderRadius: "var(--radius-sm)",
  textDecoration: "none",
};
