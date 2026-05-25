"use client";

import { ReactNode } from "react";

type Variant = "info" | "warn" | "update";

type Props = {
  variant?: Variant;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
};

const VariantIcon = ({ variant }: { variant: Variant }) => {
  if (variant === "warn") {
    return (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (variant === "update") {
    return (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
};

export function Banner({
  variant = "info",
  children,
  actionLabel,
  onAction,
  dismissible,
  onDismiss,
}: Props) {
  return (
    <div className={`banner ${variant}`} role="status">
      <span className="ico">
        <VariantIcon variant={variant} />
      </span>
      <span className="body">{children}</span>
      {actionLabel && (
        <button type="button" className="action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {dismissible && (
        <button type="button" className="x" aria-label="닫기" onClick={onDismiss}>
          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
