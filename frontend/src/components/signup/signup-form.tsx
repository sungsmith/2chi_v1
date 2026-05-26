"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div className="auth-card">
      <div className="brand">
        <img src="/logo.svg" alt="이취 (2chi)" />
        <div>
          <h1>한 번에 정리되는 지원 흐름,<br />지금 시작해요</h1>
          <p className="sub">이메일로 가입하거나 소셜 계정으로 1초 만에 시작할 수 있어요.</p>
        </div>
      </div>

      {successMessage && (
        <div role="status" className="helper" style={{ color: "var(--color-semantic-success)" }}>
          {successMessage}
        </div>
      )}
      {topError && (
        <div role="alert">
          <span className="helper error">{topError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="lbl" htmlFor="signup-email">이메일</label>
          <input
            ref={emailRef}
            id="signup-email"
            className={"input" + (errors.email ? " error" : "")}
            type="email"
            name="email"
            value={state.email}
            onChange={(e) => handleField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="hello@2chi.app"
            autoComplete="email"
          />
          <span className={"helper" + (errors.email ? " error" : "")}>
            {errors.email ?? "로그인에 사용되는 이메일"}
          </span>
        </div>
        <div className="field">
          <label className="lbl" htmlFor="signup-password">비밀번호</label>
          <input
            ref={passwordRef}
            id="signup-password"
            className={"input" + (errors.password ? " error" : "")}
            type="password"
            name="password"
            value={state.password}
            onChange={(e) => handleField("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          {errors.password && <span className="helper error">{errors.password}</span>}
          {!errors.password && <span className="helper">8자 이상, 영문/숫자/특수문자 중 2종 이상</span>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="signup-nickname">닉네임</label>
          <input
            ref={nicknameRef}
            id="signup-nickname"
            className={"input" + (errors.nickname ? " error" : "")}
            type="text"
            name="nickname"
            value={state.nickname}
            onChange={(e) => handleField("nickname", e.target.value)}
            onBlur={() => handleBlur("nickname")}
            placeholder="2~20자, 한/영/숫자"
          />
          {errors.nickname && <span className="helper error">{errors.nickname}</span>}
        </div>

        <ConsentSection
          ageConfirmed={state.ageConfirmed}
          terms={state.terms}
          privacy={state.privacy}
          marketing={state.marketing}
          onChange={(key, value) => handleField(key, value)}
          errors={errors}
        />

        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? "처리중…" : "회원가입"}
        </button>
      </form>

      <div className="auth-divider">간편 가입</div>
      <div className="auth-social">
        <button type="button" disabled><span className="ico kakao">K</span>카카오로 시작</button>
        <button type="button" disabled><span className="ico naver">N</span>네이버로 시작</button>
        <button type="button" disabled><span className="ico google">G</span>Google로 시작</button>
      </div>

      <div className="auth-foot">
        이미 회원이신가요?
        <Link href="/login">로그인</Link>
      </div>
    </div>
  );
}
