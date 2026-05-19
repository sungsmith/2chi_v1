"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { TopNav } from "@/components/app-shell/top-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace(`/login?from=${encodeURIComponent(pathname)}`);
  }, [initialized, user, router, pathname]);

  if (!initialized) return null;
  if (!user) return null;

  return (
    <>
      <TopNav />
      <main
        style={{
          background: "var(--color-bg)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {children}
      </main>
    </>
  );
}
