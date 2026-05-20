"use client";

import { useRef } from "react";
import { Calendar } from "../icons";

export type DateInputProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  id?: string;
  autoFocus?: boolean;
};

export function formatDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function DateInput({
  value, onChange, placeholder = "YYYY-MM-DD", required, error, id, autoFocus,
}: DateInputProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = hiddenRef.current;
    if (el && typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
      (el as HTMLInputElement & { showPicker: () => void }).showPicker();
    }
  }

  const isValidIso = /^\d{4}-\d{2}-\d{2}$/.test(value);

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "stretch", gap: 4, width: "100%" }}>
      <input
        id={id}
        className={`input${error ? " error" : ""}`}
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder={placeholder}
        value={value}
        required={required}
        autoFocus={autoFocus}
        onChange={(e) => onChange(formatDateMask(e.target.value))}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        className="btn ghost"
        onClick={openPicker}
        aria-label="달력 열기"
        style={{ padding: "0 10px" }}
      >
        <Calendar size={16} />
      </button>
      <input
        ref={hiddenRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={isValidIso ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 0,
          height: 0,
        }}
      />
    </div>
  );
}
