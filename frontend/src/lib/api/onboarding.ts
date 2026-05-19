import { apiUrl, http } from "./http";
import { Target } from "@/lib/enums/target";
import { TargetJob } from "@/lib/enums/target-job";

export type OnboardingPayload = {
  target: Target;
  careerYear: number;
  targetJobs: TargetJob[];
};

export type OnboardingErrorBody = {
  code: string;
  message: string;
  traceId: string;
};

export class OnboardingApiError extends Error {
  readonly status: number;
  readonly body: OnboardingErrorBody;
  constructor(status: number, body: OnboardingErrorBody) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

export async function postOnboarding(payload: OnboardingPayload): Promise<void> {
  const res = await http(apiUrl("/api/v1/onboarding"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) return;
  const body = await res.json() as OnboardingErrorBody;
  throw new OnboardingApiError(res.status, body);
}
