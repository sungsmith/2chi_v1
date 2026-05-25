"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Banner } from "@/components/ui/banner";

export function HomeBanner() {
  const { user, initialized } = useAuth();
  if (!initialized || !user || user.onboardingCompleted) return null;

  return (
    <Banner variant="info">
      온보딩을 완료하면 맞춤 분석이 시작돼요.{" "}
      <Link href="/onboarding" style={{ color: "var(--color-text-brand)", textDecoration: "underline" }}>
        지금 완료하기
      </Link>
    </Banner>
  );
}
