"use client";

import { Target, TARGET_META } from "@/lib/enums/target";
import { TargetJob, TARGET_JOB_META } from "@/lib/enums/target-job";

type Props = {
  target: Target | undefined;
  careerYear: number | undefined;
  targetJobs: Set<TargetJob>;
};

export function StepRecap({ target, careerYear, targetJobs }: Props) {
  const targetLabel = target ? TARGET_META[target].title : "—";
  const careerLabel = careerYear === undefined
    ? "—"
    : careerYear === 0 ? "신입" : careerYear === 7 ? "7년차 이상" : `${careerYear}년차`;
  const jobsLabel = targetJobs.size > 0
    ? [...targetJobs].map((j) => TARGET_JOB_META[j].name).join(" · ")
    : "—";

  return (
    <section>
      <h2 style={{ fontFamily: "var(--font-family-hand)", fontSize: "var(--fs-section-title)", marginBottom: "var(--space-2)" }}>
        내 경험을 한 번 정리하면,
      </h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
        알려주신 정보로 자소서·지원 흐름이 자동으로 이어져요.
      </p>
      <div style={{
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}>
        <RecapRow k="준비" v={targetLabel} />
        <Divider />
        <RecapRow k="경력" v={careerLabel} />
        <Divider />
        <RecapRow k="직무" v={jobsLabel} />
      </div>
    </section>
  );
}

function RecapRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ color: "var(--color-text-muted)", fontSize: "var(--fs-body-sm)" }}>{k}</span>
      <b style={{ fontSize: "var(--fs-body)" }}>{v}</b>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--color-border-subtle)" }} />;
}
