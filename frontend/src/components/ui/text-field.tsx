"use client";

import { InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helper?: string;
};

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, helper, id, required, ...rest },
  ref
) {
  const inputId = id ?? `${label}-${rest.name ?? ""}`;
  const borderColor = error ? "var(--color-semantic-error)" : "var(--color-border-default)";

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
        {required && <span style={{ color: "var(--color-semantic-error)", marginLeft: 4 }}>*</span>}
      </label>
      <input
        ref={ref}
        id={inputId}
        required={required}
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
