"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "./stepper";
import { StepPurpose } from "./step-purpose";
import { StepCareer } from "./step-career";
import { StepPositions } from "./step-positions";
import { StepRecap } from "./step-recap";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/auth-context";
import { postOnboarding, OnboardingApiError } from "@/lib/api/onboarding";
import { Target } from "@/lib/enums/target";
import { TargetJob } from "@/lib/enums/target-job";

export function OnboardingFlow() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [current, setCurrent] = useState<1 | 2 | 3 | 4>(1);
  const [target, setTarget] = useState<Target | undefined>();
  const [careerYear, setCareerYear] = useState<number | undefined>();
  const [targetJobs, setTargetJobs] = useState<Set<TargetJob>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | undefined>();

  function toggleJob(j: TargetJob) {
    setTargetJobs((prev) => {
      const next = new Set(prev);
      if (next.has(j)) next.delete(j); else next.add(j);
      return next;
    });
  }

  const canNext =
    (current === 1 && !!target) ||
    (current === 2 && careerYear !== undefined) ||
    (current === 3 && targetJobs.size > 0);

  async function submit() {
    setSubmitting(true);
    setTopError(undefined);
    try {
      await postOnboarding({
        target: target!,
        careerYear: careerYear!,
        targetJobs: [...targetJobs],
      });
      await refreshUser();
      router.push("/");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <Stepper current={current} />

      {topError && (
        <div role="alert" style={{
          padding: "var(--space-3) var(--space-4)",
          background: "var(--color-semantic-error-bg)",
          color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--fs-body-sm)",
        }}>{topError}</div>
      )}

      {current === 1 && <StepPurpose value={target} onChange={setTarget} />}
      {current === 2 && <StepCareer value={careerYear} onChange={setCareerYear} />}
      {current === 3 && <StepPositions value={targetJobs} onToggle={toggleJob} />}
      {current === 4 && <StepRecap target={target} careerYear={careerYear} targetJobs={targetJobs} />}

      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <Button
          type="button"
          variant="secondary"
          disabled={current === 1 || submitting}
          onClick={() => setCurrent((c) => (c > 1 ? ((c - 1) as 1 | 2 | 3 | 4) : c))}
        >
          이전
        </Button>

        {current < 4 ? (
          <Button
            type="button"
            disabled={!canNext}
            onClick={() => setCurrent((c) => (c < 4 ? ((c + 1) as 1 | 2 | 3 | 4) : c))}
          >
            다음
          </Button>
        ) : (
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Button type="button" variant="secondary" disabled={submitting} onClick={() => router.push("/")}>
              나중에
            </Button>
            <Button type="button" disabled={submitting} onClick={submit}>
              {submitting ? "처리중…" : "완료"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
