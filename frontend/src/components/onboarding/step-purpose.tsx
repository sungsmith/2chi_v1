"use client";

import { Target, TARGETS, TARGET_META } from "@/lib/enums/target";

type Props = { value: Target | undefined; onChange: (v: Target) => void };

export function StepPurpose({ value, onChange }: Props) {
  return (
    <section>
      <h2 style={{ fontFamily: "var(--font-family-hand)", fontSize: "var(--fs-section-title)", marginBottom: "var(--space-2)" }}>
        지금 어떤 준비 중이신가요?
      </h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
        목적에 맞춰 자소서 톤과 추천 흐름이 자연스럽게 조정돼요.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
        {TARGETS.map((t) => {
          const meta = TARGET_META[t];
          const selected = value === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
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
                {meta.title}
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
