"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helper?: string;
};

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, helper, id, required, onFocus, onBlur, ...rest },
  ref
) {
  const inputId = id ?? `${label}-${rest.name ?? ""}`;
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? "var(--color-semantic-error)"
    : focused
      ? "var(--color-border-focus)"
      : "var(--color-border-default)";
  const boxShadow = focused
    ? (error ? "var(--focus-ring-error)" : "var(--focus-ring)")
    : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", width: "100%" }}>
      <label
        htmlFor={inputId}
        style={{
          fontSize: "var(--fs-label)",
          fontWeight: 600,
          color: "var(--color-text-primary)",
        }}
      >
        {label}
        {required && <span style={{ color: "var(--color-semantic-error)", marginLeft: "var(--space-1)" }}>*</span>}
      </label>
      <input
        ref={ref}
        id={inputId}
        required={required}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        {...rest}
        style={{
          padding: "var(--space-3) var(--space-4)",
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--radius-md)",
          fontSize: "var(--fs-body)",
          fontFamily: "var(--font-family-sans)",
          color: "var(--color-text-primary)",
          background: "var(--color-surface-default)",
          outline: "none",
          boxShadow,
          transition: "border-color 120ms, box-shadow 120ms",
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
      />
      {error && (
        <span
          id={`${inputId}-error`}
          style={{ fontSize: "var(--fs-helper)", color: "var(--color-semantic-error)" }}
        >
          {error}
        </span>
      )}
      {!error && helper && (
        <span
          id={`${inputId}-helper`}
          style={{ fontSize: "var(--fs-helper)", color: "var(--color-text-muted)" }}
        >
          {helper}
        </span>
      )}
    </div>
  );
});
