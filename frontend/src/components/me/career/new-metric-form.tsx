"use client";

import { useState } from "react";
import type { Metric } from "@/lib/types/career";

type Props = {
  onSubmit: (metric: Metric) => void;
  onCancel: () => void;
};

type Variant = "compare" | "delta";
type Errors = { k?: string; before?: string; after?: string; delta?: string };

export function NewMetricForm({ onSubmit, onCancel }: Props) {
  const [variant, setVariant] = useState<Variant>("compare");
  const [k, setK] = useState("");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [delta, setDelta] = useState("");
  const [dir, setDir] = useState<"up" | "down">("up");
  const [errors, setErrors] = useState<Errors>({});

  function validate(): Errors {
    const e: Errors = {};
    if (!k.trim()) e.k = "지표명을 입력해주세요";
    if (variant === "compare") {
      if (!before.trim()) e.before = "값을 입력해주세요";
      if (!after.trim()) e.after = "값을 입력해주세요";
    } else {
      if (!delta.trim()) e.delta = "증감 값을 입력해주세요";
    }
    return e;
  }

  function handleSubmit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const metric: Metric = variant === "compare"
      ? { k: k.trim(), before: before.trim(), after: after.trim() }
      : { k: k.trim(), delta: delta.trim(), dir };
    onSubmit(metric);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      onKeyDown={onKeyDown}
      style={{
        marginTop: 8, padding: 12,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-md)",
        display: "grid", gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span className="lbl">타입</span>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <input
            type="radio" name="metric-variant"
            checked={variant === "compare"}
            onChange={() => setVariant("compare")}
          />
          비교 (전·후)
        </label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <input
            type="radio" name="metric-variant"
            checked={variant === "delta"}
            onChange={() => setVariant("delta")}
          />
          증감 (Δ)
        </label>
      </div>
      <div className="field">
        <label className="lbl" htmlFor="nm-k">지표<span className="req">*</span></label>
        <input
          id="nm-k"
          className={`input${errors.k ? " error" : ""}`}
          autoFocus
          value={k}
          onChange={(e) => setK(e.target.value)}
          placeholder="예) TPS, 매출"
        />
        {errors.k && <div className="helper error">{errors.k}</div>}
      </div>
      {variant === "compare" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="lbl" htmlFor="nm-before">전<span className="req">*</span></label>
            <input
              id="nm-before"
              className={`input${errors.before ? " error" : ""}`}
              value={before}
              onChange={(e) => setBefore(e.target.value)}
              placeholder="예) 500"
            />
            {errors.before && <div className="helper error">{errors.before}</div>}
          </div>
          <div className="field">
            <label className="lbl" htmlFor="nm-after">후<span className="req">*</span></label>
            <input
              id="nm-after"
              className={`input${errors.after ? " error" : ""}`}
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              placeholder="예) 2000"
            />
            {errors.after && <div className="helper error">{errors.after}</div>}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="lbl" htmlFor="nm-delta">증감<span className="req">*</span></label>
            <input
              id="nm-delta"
              className={`input${errors.delta ? " error" : ""}`}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="예) ₩2,000,000"
            />
            {errors.delta && <div className="helper error">{errors.delta}</div>}
          </div>
          <div className="field">
            <span className="lbl">방향</span>
            <div style={{ display: "flex", gap: 12, paddingTop: 6 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <input type="radio" name="metric-dir" checked={dir === "up"} onChange={() => setDir("up")} />
                ↑ 증가
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <input type="radio" name="metric-dir" checked={dir === "down"} onChange={() => setDir("down")} />
                ↓ 감소
              </label>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={onCancel}>취소</button>
        <button type="submit" className="btn">저장</button>
      </div>
    </form>
  );
}
