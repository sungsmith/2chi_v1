"use client";

const STEPS = [
  { num: 1, label: "접속 목적" },
  { num: 2, label: "경력 연차" },
  { num: 3, label: "희망 직무" },
  { num: 4, label: "확인" },
];

export function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-8)" }}>
      {STEPS.map((s) => {
        const state = current === s.num ? "active" : current > s.num ? "done" : "future";
        const bg = state === "active"
          ? "var(--color-primary-500)"
          : state === "done"
            ? "var(--color-primary-200)"
            : "var(--color-surface-sunken)";
        const color = state === "future" ? "var(--color-text-muted)" : "var(--color-text-inverse)";
        return (
          <div
            key={s.num}
            aria-current={state === "active" ? "step" : undefined}
            style={{
              flex: 1,
              padding: "var(--space-2) var(--space-3)",
              background: bg,
              color,
              borderRadius: "var(--radius-md)",
              fontSize: "var(--fs-helper)",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            <span style={{ display: "block", fontSize: "var(--fs-caption)", opacity: 0.85 }}>
              STEP {s.num}
            </span>
            {s.label}
          </div>
        );
      })}
    </div>
  );
}
