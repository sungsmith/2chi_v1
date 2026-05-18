"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "../ui/text-field";
import { Button } from "../ui/button";
import { ConsentSection } from "./consent-section";
import {
  validateEmail,
  validatePassword,
  validateNickname,
  validateSignup,
  SignupErrors,
  SignupFormState,
} from "@/lib/validation/signup";
import { signup, SignupApiError } from "@/lib/api/auth";

const INITIAL: SignupFormState = {
  email: "",
  password: "",
  nickname: "",
  ageConfirmed: false,
  terms: false,
  privacy: false,
  marketing: false,
};

const FIELD_FOCUS_ORDER: (keyof SignupErrors)[] = [
  "email",
  "password",
  "nickname",
  "ageConfirmed",
  "terms",
  "privacy",
];

export function SignupForm() {
  const router = useRouter();
  const [state, setState] = useState<SignupFormState>(INITIAL);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [topError, setTopError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nicknameRef = useRef<HTMLInputElement>(null);

  function focusFirstError(errs: SignupErrors) {
    for (const key of FIELD_FOCUS_ORDER) {
      if (!errs[key]) continue;
      if (key === "email") emailRef.current?.focus();
      else if (key === "password") passwordRef.current?.focus();
      else if (key === "nickname") nicknameRef.current?.focus();
      return;
    }
  }

  function handleField<K extends keyof SignupFormState>(key: K, value: SignupFormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleBlur(key: "email" | "password" | "nickname") {
    setErrors((prev) => {
      const next = { ...prev };
      if (key === "email")    next.email    = validateEmail(state.email);
      if (key === "password") next.password = validatePassword(state.password);
      if (key === "nickname") next.nickname = validateNickname(state.nickname);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTopError(undefined);
    setSuccessMessage(undefined);

    const nextErrors = validateSignup(state);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      focusFirstError(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        email: state.email,
        password: state.password,
        nickname: state.nickname,
        ageConfirmed: state.ageConfirmed,
        consents: { terms: state.terms, privacy: state.privacy, marketing: state.marketing },
      });
      setSuccessMessage("가입이 완료되었습니다. 잠시 후 로그인 화면으로 이동합니다.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      if (err instanceof SignupApiError) {
        if (err.body.code === "EMAIL_DUPLICATE") {
          setErrors((p) => ({ ...p, email: err.body.message }));
          emailRef.current?.focus();
        } else if (err.body.code === "NICKNAME_DUPLICATE") {
          setErrors((p) => ({ ...p, nickname: err.body.message }));
          nicknameRef.current?.focus();
        } else if (err.body.code === "VALIDATION_FAILED" && err.body.errors) {
          const fieldMap: SignupErrors = {};
          for (const fe of err.body.errors) {
            if (fe.field === "email")    fieldMap.email = fe.message;
            if (fe.field === "password") fieldMap.password = fe.message;
            if (fe.field === "nickname") fieldMap.nickname = fe.message;
          }
          setErrors((p) => ({ ...p, ...fieldMap }));
          focusFirstError(fieldMap);
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
      {successMessage && (
        <div
          role="status"
          style={{
            padding: "var(--space-3) var(--space-4)",
            background: "var(--color-semantic-success-bg)",
            color: "var(--color-semantic-success)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--fs-body-sm)",
          }}
        >
          {successMessage}
        </div>
      )}
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
        value={state.email}
        onChange={(e) => handleField("email", e.target.value)}
        onBlur={() => handleBlur("email")}
        error={errors.email}
        required
        autoComplete="email"
      />
      <TextField
        ref={passwordRef}
        label="비밀번호"
        type="password"
        name="password"
        value={state.password}
        onChange={(e) => handleField("password", e.target.value)}
        onBlur={() => handleBlur("password")}
        error={errors.password}
        helper="8자 이상, 영문/숫자/특수문자 중 2종 이상"
        required
        autoComplete="new-password"
      />
      <TextField
        ref={nicknameRef}
        label="닉네임"
        type="text"
        name="nickname"
        value={state.nickname}
        onChange={(e) => handleField("nickname", e.target.value)}
        onBlur={() => handleBlur("nickname")}
        error={errors.nickname}
        helper="2~20자, 한글/영문/숫자만"
        required
      />

      <ConsentSection
        ageConfirmed={state.ageConfirmed}
        terms={state.terms}
        privacy={state.privacy}
        marketing={state.marketing}
        onChange={(key, value) => handleField(key, value)}
        errors={errors}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? "처리중…" : "가입하기"}
      </Button>
    </form>
  );
}
