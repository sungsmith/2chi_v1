"use client";

import { useState } from "react";
import Link from "next/link";

export function ResetPasswordForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");

  return (
    <div className="auth-card">
      <div className="brand">
        <img src="/logo.svg" alt="이취 (2chi)" />
      </div>

      <div className="auth-stepper">
        <span className={"dot" + (step > 1 ? " done" : " active")}>
          {step > 1 ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          ) : "1"}
        </span>
        <span className={"lbl" + (step === 1 ? " active" : "")}>이메일 확인</span>
        <span className="sep" />
        <span className={"dot" + (step > 2 ? " done" : step === 2 ? " active" : "")}>
          {step > 2 ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          ) : "2"}
        </span>
        <span className={"lbl" + (step === 2 ? " active" : "")}>메일 확인</span>
        <span className="sep" />
        <span className={"dot" + (step === 3 ? " active" : "")}>3</span>
        <span className={"lbl" + (step === 3 ? " active" : "")}>새 비밀번호</span>
      </div>

      {step === 1 && (
        <>
          <div className="brand" style={{ gap: 8 }}>
            <h1 style={{ margin: 0 }}>비밀번호 재설정</h1>
            <p className="sub">가입할 때 사용한 이메일을 입력해주세요. 재설정 링크를 보내드릴게요.</p>
          </div>
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
          >
            <div className="field">
              <label className="lbl" htmlFor="reset-email">이메일</label>
              <input
                id="reset-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>
            <button type="submit" className="primary-btn">재설정 링크 보내기</button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="auth-empty">
            <span className="mascot-cloud lg happy" aria-hidden="true" />
            <h2>메일함을 확인해주세요</h2>
            <p>
              아래 이메일로 재설정 링크를 보냈어요.<br />
              링크는 <b>1시간</b> 동안 유효해요.
            </p>
            <span className="email-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>{" "}
              {email || "somi.kim@example.com"}
            </span>
          </div>
          <button className="primary-btn" onClick={() => setStep(3)}>
            메일 링크 클릭한 척하기 (데모)
          </button>
          <div className="auth-foot">
            메일이 안 왔나요?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStep(1);
              }}
            >
              다시 보내기
            </a>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="brand" style={{ gap: 8 }}>
            <h1 style={{ margin: 0 }}>새 비밀번호 설정</h1>
            <p className="sub">새 비밀번호로 다시 로그인할게요.</p>
          </div>
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(4);
            }}
          >
            <div className="field">
              <label className="lbl" htmlFor="reset-new-password">새 비밀번호</label>
              <input
                id="reset-new-password"
                className="input"
                type="password"
                placeholder="••••••••"
                autoFocus
                autoComplete="new-password"
              />
              <span className="helper">8자 이상, 영문/숫자/특수문자 중 2종 이상</span>
            </div>
            <div className="field">
              <label className="lbl" htmlFor="reset-confirm-password">새 비밀번호 확인</label>
              <input
                id="reset-confirm-password"
                className="input"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="primary-btn">비밀번호 변경 완료</button>
          </form>
        </>
      )}

      {step === 4 && (
        <div className="auth-empty">
          <span className="mascot-cloud lg happy" aria-hidden="true" />
          <h2>비밀번호가 변경됐어요</h2>
          <p>새 비밀번호로 로그인해주세요.</p>
          <Link className="primary-btn" href="/login">로그인으로</Link>
        </div>
      )}

      {step !== 3 && step !== 4 && (
        <div className="auth-foot">
          기억나셨나요?{" "}
          <Link className="link" href="/login">로그인으로</Link>
        </div>
      )}
    </div>
  );
}
