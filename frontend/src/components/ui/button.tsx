"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", children, disabled, ...rest },
  ref
) {
  const bg = variant === "primary"
    ? (disabled ? "var(--color-neutral-300)" : "var(--color-primary-500)")
    : "var(--color-surface-default)";
  const color = variant === "primary"
    ? "var(--color-text-inverse)"
    : "var(--color-text-primary)";
  const border = variant === "primary"
    ? "none"
    : "1px solid var(--color-border-strong)";

  return (
    <button
      ref={ref}
      disabled={disabled}
      {...rest}
      style={{
        padding: "var(--space-3) var(--space-6)",
        background: bg,
        color,
        border,
        borderRadius: "var(--radius-md)",
        fontSize: "var(--fs-button)",
        fontWeight: 600,
        fontFamily: "var(--font-family-sans)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
});
