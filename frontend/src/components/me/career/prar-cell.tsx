"use client";

import { useState } from "react";

type Props = {
  tone: "p" | "r1" | "a" | "r2";
  glyph: "P" | "R" | "A";
  ko: "문제" | "원인" | "접근" | "결과";
  en: "PROBLEM" | "ROOT CAUSE" | "APPROACH" | "RESULT";
  value: string | null;
  max?: number;
  placeholder: string;
  onChange: (value: string) => void;
};

export function PrarCell({ tone, glyph, ko, en, value, max = 240, placeholder, onChange }: Props) {
  const [local, setLocal] = useState<string>(value ?? "");
  const len = local.length;

  return (
    <div className={"prar-cell " + tone}>
      <div className="cell-head">
        <span className="glyph">{glyph}</span>
        <span className="cell-title">
          <span className="ko">{ko}</span>
          <span className="en">{en}</span>
        </span>
        <span className="cell-count">{len} / {max}</span>
      </div>
      <textarea
        className="ta"
        value={local}
        placeholder={placeholder}
        maxLength={max}
        rows={3}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== (value ?? "")) onChange(local);
        }}
      />
    </div>
  );
}
