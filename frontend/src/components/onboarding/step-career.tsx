"use client";

const YEARS = [
  { value: 0, num: "신입", lbl: "0년" },
  { value: 1, num: "1", lbl: "년차" },
  { value: 2, num: "2", lbl: "년차" },
  { value: 3, num: "3", lbl: "년차" },
  { value: 4, num: "4", lbl: "년차" },
  { value: 5, num: "5", lbl: "년차" },
  { value: 6, num: "6", lbl: "년차" },
  { value: 7, num: "7+", lbl: "년차 이상" },
];

type Props = { value: number | undefined; onChange: (v: number) => void };

export function StepCareer({ value, onChange }: Props) {
  return (
    <section>
      <h2 style={{ fontFamily: "var(--font-family-hand)", fontSize: "var(--fs-section-title)", marginBottom: "var(--space-2)" }}>
        경력을 알려주세요.
      </h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
        신입 / 주니어 / 시니어에 맞는 자소서 톤이 자동으로 조정돼요.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-3)" }}>
        {YEARS.map((y) => {
          const selected = value === y.value;
          return (
            <button
              key={y.value}
              type="button"
              onClick={() => onChange(y.value)}
              aria-pressed={selected}
              style={{
                padding: "var(--space-4)",
                background: selected ? "var(--color-primary-50)" : "var(--color-surface-default)",
                border: `1px solid ${selected ? "var(--color-primary-500)" : "var(--color-border-default)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600 }}>{y.num}</div>
              <div style={{ fontSize: "var(--fs-helper)", color: "var(--color-text-muted)" }}>{y.lbl}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
