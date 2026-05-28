"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SignupApiError } from "@/lib/api/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [topError, setTopError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<"password-changed" | "withdrawn" | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // banner 는 비밀번호 변경 / 회원탈퇴 흐름이 sessionStorage 로 전달.
  // URL 쿼리 대신 sessionStorage 를 쓰는 이유는 layout guard 의 자동 redirect 와의
  // race 에 영향받지 않기 위함 (docs/issues/0005 참조). mount 직후 1회 읽고 제거.
  // setBanner 는 Promise.resolve().then 으로 effect 동기 흐름 밖에서 호출
  // (react-hooks/set-state-in-effect 회피 — docs/learning/react19-set-state-in-effect-pattern).
  useEffect(() => {
    const b = sessionStorage.getItem("loginBanner");
    if (b === "password-changed" || b === "withdrawn") {
      sessionStorage.removeItem("loginBanner");
      Promise.resolve().then(() => setBanner(b));
    }
  }, []);

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
      const u = await login(email, password);
      const from = searchParams.get("from");
      const safeFrom = from && from.startsWith("/") ? from : null;
      const dest = u.onboardingCompleted ? (safeFrom ?? "/") : "/onboarding";
      router.push(dest);
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
    <div className="auth-card">
      {banner === "password-changed" && (
        <div className="info-banner" role="status">
          <span className="body">비밀번호가 변경됐어요. 새 비밀번호로 다시 로그인해주세요.</span>
          <button
            type="button"
            className="x"
            aria-label="닫기"
            onClick={() => setBanner(null)}
          >
            ×
          </button>
        </div>
      )}
      {banner === "withdrawn" && (
        <div className="info-banner" role="status">
          <span className="body">탈퇴 처리됐어요. 30일 이내에 같은 이메일로 로그인하면 복구할 수 있어요.</span>
          <button
            type="button"
            className="x"
            aria-label="닫기"
            onClick={() => setBanner(null)}
          >
            ×
          </button>
        </div>
      )}
      <div className="brand">
        <img src="/logo.svg" alt="이취 (2chi)" />
        <div>
          <h1>다시 만나서 반가워요</h1>
          <p className="sub">이메일로 로그인하거나 소셜 계정으로 빠르게 들어오세요.</p>
        </div>
      </div>

      {topError && (
        <div role="alert" style={{ marginBottom: 4 }}>
          <span className="helper error">{topError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="lbl" htmlFor="login-email">이메일</label>
          <input
            ref={emailRef}
            id="login-email"
            className={"input" + (emailError ? " error" : "")}
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {emailError && <span className="helper error">{emailError}</span>}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="login-password">비밀번호</label>
          <input
            ref={passwordRef}
            id="login-password"
            className={"input" + (passwordError ? " error" : "")}
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {passwordError && <span className="helper error">{passwordError}</span>}
        </div>
        <div className="row">
          <span className="check" aria-hidden="true" />
          <Link className="link" href="/reset-password">비밀번호 재설정</Link>
        </div>
        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? "처리중…" : "로그인"}
        </button>
      </form>

      <div className="auth-divider">소셜 로그인</div>
      <div className="auth-social">
        <button type="button" disabled><span className="ico kakao">K</span>카카오로 로그인</button>
        <button type="button" disabled><span className="ico naver">N</span>네이버로 로그인</button>
        <button type="button" disabled><span className="ico google">G</span>Google로 로그인</button>
      </div>

      <div className="auth-foot">
        아직 이취 회원이 아니신가요?
        <Link href="/signup">회원가입</Link>
      </div>
    </div>
  );
}
