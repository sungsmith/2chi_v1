"use client";

import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, id, required, ...rest },
  ref
) {
  const inputId = id ?? `cb-${rest.name ?? ""}`;
  return (
    <label
      htmlFor={inputId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        fontSize: "var(--fs-body-sm)",
        color: "var(--color-text-primary)",
        cursor: "pointer",
      }}
    >
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        required={required}
        {...rest}
        style={{
          width: 16,
          height: 16,
          accentColor: "var(--color-primary-500)",
          cursor: "pointer",
        }}
      />
      <span>
        {label}
        {required && <span style={{ color: "var(--color-semantic-error)", marginLeft: 4 }}>*</span>}
      </span>
    </label>
  );
});
