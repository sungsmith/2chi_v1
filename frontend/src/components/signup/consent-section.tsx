"use client";

import Link from "next/link";
import { Checkbox } from "../ui/checkbox";
import { SignupErrors } from "@/lib/validation/signup";

type Props = {
  ageConfirmed: boolean;
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
  onChange: (key: "ageConfirmed" | "terms" | "privacy" | "marketing", value: boolean) => void;
  errors: SignupErrors;
};

export function ConsentSection({ ageConfirmed, terms, privacy, marketing, onChange, errors }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <Checkbox
        name="ageConfirmed"
        checked={ageConfirmed}
        onChange={(e) => onChange("ageConfirmed", e.target.checked)}
        required
        label="만 14세 이상입니다."
      />
      {errors.ageConfirmed && (
        <span style={{ color: "var(--color-semantic-error)", fontSize: "var(--fs-helper)" }}>
          {errors.ageConfirmed}
        </span>
      )}

      <Checkbox
        name="terms"
        checked={terms}
        onChange={(e) => onChange("terms", e.target.checked)}
        required
        label={
          <>
            <Link href="/terms" target="_blank" style={{ color: "var(--color-text-brand)", textDecoration: "underline" }}>
              서비스 이용 약관
            </Link>
            에 동의합니다.
          </>
        }
      />
      {errors.terms && (
        <span style={{ color: "var(--color-semantic-error)", fontSize: "var(--fs-helper)" }}>
          {errors.terms}
        </span>
      )}

      <Checkbox
        name="privacy"
        checked={privacy}
        onChange={(e) => onChange("privacy", e.target.checked)}
        required
        label={
          <>
            <Link href="/privacy" target="_blank" style={{ color: "var(--color-text-brand)", textDecoration: "underline" }}>
              개인정보 수집·이용
            </Link>
            에 동의합니다.
          </>
        }
      />
      {errors.privacy && (
        <span style={{ color: "var(--color-semantic-error)", fontSize: "var(--fs-helper)" }}>
          {errors.privacy}
        </span>
      )}

      <Checkbox
        name="marketing"
        checked={marketing}
        onChange={(e) => onChange("marketing", e.target.checked)}
        label="(선택) 마케팅 정보 수신에 동의합니다."
      />
    </div>
  );
}
