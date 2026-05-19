"use client";

import { TargetJob, TARGET_JOBS, TARGET_JOB_META } from "@/lib/enums/target-job";

type Props = {
  value: Set<TargetJob>;
  onToggle: (job: TargetJob) => void;
};

export function StepPositions({ value, onToggle }: Props) {
  return (
    <section>
      <h2 style={{ fontFamily: "var(--font-family-hand)", fontSize: "var(--fs-section-title)", marginBottom: "var(--space-2)" }}>
        희망하는 직무를 선택해주세요.
      </h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
        여러 직무를 함께 선택할 수 있어요.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
        {TARGET_JOBS.map((job) => {
          const meta = TARGET_JOB_META[job];
          const selected = value.has(job);
          return (
            <button
              key={job}
              type="button"
              onClick={() => onToggle(job)}
              aria-pressed={selected}
              style={{
                textAlign: "left",
                padding: "var(--space-5)",
                background: selected ? "var(--color-primary-50)" : "var(--color-surface-default)",
                border: `1px solid ${selected ? "var(--color-primary-500)" : "var(--color-border-default)"}`,
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "var(--fs-card-title)", marginBottom: "var(--space-2)" }}>
                {meta.name}
              </div>
              <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--fs-body-sm)" }}>
                {meta.desc}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
