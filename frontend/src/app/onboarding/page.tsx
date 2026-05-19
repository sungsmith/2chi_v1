"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default function OnboardingPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!user) { router.replace("/login"); return; }
    if (user.onboardingCompleted) router.replace("/");
  }, [initialized, user, router]);

  if (!initialized || !user || user.onboardingCompleted) return null;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "var(--space-12) var(--space-6)" }}>
      <OnboardingFlow />
    </main>
  );
}
