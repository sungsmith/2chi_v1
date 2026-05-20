"use client";

import { ReactNode } from "react";

type Props = {
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
};

export function NavIconButton({ ariaLabel, onClick, children }: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        borderRadius: "var(--radius-md)",
        color: "var(--color-text-secondary)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
