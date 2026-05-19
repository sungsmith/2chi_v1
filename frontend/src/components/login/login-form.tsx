"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextField } from "../ui/text-field";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/auth-context";
import { SignupApiError } from "@/lib/api/auth";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [topError, setTopError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTopError(undefined);

    let hasError = false;
    let firstErrorField: "email" | "password" | null = null;
    if (!email) {
      setEmailError("이메일을 입력해주세요.");
      hasError = true;
      firstErrorField = "email";
    } else {
      setEmailError(undefined);
    }
    if (!password) {
      setPasswordError("비밀번호를 입력해주세요.");
      hasError = true;
      if (!firstErrorField) firstErrorField = "password";
    } else {
      setPasswordError(undefined);
    }
    if (hasError) {
      if (firstErrorField === "email") emailRef.current?.focus();
      else if (firstErrorField === "password") passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof SignupApiError) {
        if (err.body.code === "INVALID_CREDENTIALS") {
          setTopError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else if (err.body.code === "ACCOUNT_LOCKED") {
          const seconds = Number(err.body.metadata?.retryAfterSeconds ?? 600);
          const minutes = Math.max(1, Math.ceil(seconds / 60));
          setTopError(`계정이 잠겼습니다. ${minutes}분 후 다시 시도해주세요.`);
        } else if (err.status >= 500) {
          setTopError("잠시 후 다시 시도해주세요.");
        } else {
          setTopError(err.body.message);
        }
      } else {
        setTopError("잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {topError && (
        <div
          role="alert"
          style={{
            padding: "var(--space-3) var(--space-4)",
            background: "var(--color-semantic-error-bg)",
            color: "var(--color-semantic-error)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--fs-body-sm)",
          }}
        >
          {topError}
        </div>
      )}

      <TextField
        ref={emailRef}
        label="이메일"
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        required
        autoComplete="email"
      />
      <TextField
        ref={passwordRef}
        label="비밀번호"
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={passwordError}
        required
        autoComplete="current-password"
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? "처리중…" : "로그인"}
      </Button>

      <p style={{ fontSize: "var(--fs-body-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>
        회원이 아니신가요?{" "}
        <Link href="/signup" style={{ color: "var(--color-text-brand)" }}>
          회원가입
        </Link>
      </p>
    </form>
  );
}
