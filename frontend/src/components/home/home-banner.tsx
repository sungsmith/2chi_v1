"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export function HomeBanner() {
  const { user, initialized } = useAuth();
  if (!initialized || !user || user.onboardingCompleted) return null;

  return (
    <div
      role="status"
      style={{
        padding: "var(--space-4) var(--space-5)",
        background: "var(--color-semantic-info-bg)",
        color: "var(--color-text-brand)",
        borderRadius: "var(--radius-md)",
        marginBottom: "var(--space-8)",
        fontSize: "var(--fs-body-sm)",
      }}
    >
      온보딩을 완료하면 맞춤 분석이 시작돼요.{" "}
      <Link href="/onboarding" style={{ color: "var(--color-text-brand)", textDecoration: "underline" }}>
        지금 완료하기
      </Link>
    </div>
  );
}
