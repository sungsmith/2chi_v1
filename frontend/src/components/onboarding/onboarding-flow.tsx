"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { postOnboarding, OnboardingApiError } from "@/lib/api/onboarding";
import { Target } from "@/lib/enums/target";
import { TargetJob } from "@/lib/enums/target-job";
import { BrandPanel } from "./brand-panel";
import { Stepper } from "./stepper";
import { StepPurpose } from "./step-purpose";
import { StepCareer } from "./step-career";
import { StepPositions } from "./step-positions";
import { StepRecap } from "./step-recap";
import { WelcomeModal } from "./welcome-modal";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";

export function OnboardingFlow() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [current, setCurrent] = useState<1 | 2 | 3 | 4>(1);
  const [target, setTarget] = useState<Target | undefined>();
  const [careerYear, setCareerYear] = useState<number | undefined>();
  const [targetJobs, setTargetJobs] = useState<Set<TargetJob>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | undefined>();
  const [showWelcome, setShowWelcome] = useState(false);

  function toggleJob(j: TargetJob) {
    setTargetJobs((prev) => {
      const next = new Set(prev);
      if (next.has(j)) next.delete(j);
      else next.add(j);
      return next;
    });
  }

  const canNext =
    (current === 1 && !!target) ||
    (current === 2 && careerYear !== undefined) ||
    (current === 3 && targetJobs.size > 0) ||
    current === 4;

  async function submit() {
    setSubmitting(true);
    setTopError(undefined);
    try {
      await postOnboarding({
        target: target!,
        careerYear: careerYear!,
        targetJobs: [...targetJobs],
      });
      setShowWelcome(true);
    } catch (err) {
      if (err instanceof OnboardingApiError) {
        setTopError(err.body.message ?? "온보딩 저장에 실패했습니다.");
      } else {
        setTopError("잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function dismissWelcome() {
    setShowWelcome(false);
    await refreshUser();
    router.push("/");
  }

  function handlePrev() {
    setCurrent((c) => (c > 1 ? ((c - 1) as 1 | 2 | 3 | 4) : c));
  }

  function handleSkip() {
    router.push("/");
  }

  function handleNext() {
    if (current < 4) {
      setCurrent((c) => (c + 1) as 1 | 2 | 3 | 4);
    } else {
      submit();
    }
  }

  return (
    <>
      <BrandPanel />

      <section className="onb-right">
        <Stepper current={current} />

        {topError && (
          <div
            role="alert"
            style={{
              padding: "var(--space-3) var(--space-4)",
              background: "var(--color-semantic-error-bg)",
              color: "var(--color-semantic-error)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--fs-body-sm)",
              marginTop: "var(--space-4)",
            }}
          >
            {topError}
          </div>
        )}

        {current === 1 && <StepPurpose value={target} onChange={setTarget} />}
        {current === 2 && <StepCareer value={careerYear} onChange={setCareerYear} />}
        {current === 3 && <StepPositions value={targetJobs} onToggle={toggleJob} />}
        {current === 4 && <StepRecap target={target} careerYear={careerYear} targetJobs={targetJobs} />}

        <div className="onb-footer">
          <button
            type="button"
            className="btn ghost"
            disabled={current === 1 || submitting}
            onClick={handlePrev}
          >
            <ArrowLeft /> 이전
          </button>
          <div className="onb-footer-right">
            <button
              type="button"
              className="btn ghost skip"
              disabled={submitting}
              onClick={handleSkip}
            >
              나중에 할게요
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={!canNext || submitting}
              onClick={handleNext}
            >
              {current === 4
                ? submitting ? "처리중…" : "시작하기"
                : "다음"}
              <ArrowRight />
            </button>
          </div>
        </div>
      </section>

      {showWelcome && target !== undefined && careerYear !== undefined && (
        <WelcomeModal
          target={target}
          careerYear={careerYear}
          targetJobs={targetJobs}
          onDismiss={dismissWelcome}
        />
      )}
    </>
  );
}
