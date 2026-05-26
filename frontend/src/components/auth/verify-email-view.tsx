"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your-email@example.com";

  return (
    <div className="auth-card">
      <div className="brand">
        <img src="/logo.svg" alt="이취 (2chi)" />
      </div>

      <div className="auth-empty">
        <span className="mascot-cloud lg wave" aria-hidden="true" />
        <h2>회원가입을 도와드릴게요</h2>
        <p>
          거의 다 됐어요. 메일함에서 인증 메일을 열고<br />
          <b>&quot;이메일 인증하기&quot;</b> 버튼을 눌러주세요.
        </p>
        <span className="email-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>{" "}
          {email}
        </span>
      </div>

      <div className="auth-divider">메일이 오지 않았나요</div>
      <div className="auth-foot" style={{ textAlign: "center", lineHeight: 1.7 }}>
        <ul style={{ textAlign: "left", padding: "0 4px 0 18px", margin: 0, fontSize: 12.5, color: "var(--color-text-secondary)" }}>
          <li>스팸함 · 프로모션함을 확인해주세요</li>
          <li>이메일 주소를 잘못 입력했다면 다시 가입해주세요</li>
          <li>그래도 안 온다면 5분 후 다시 보내기를 눌러주세요</li>
        </ul>
      </div>

      <button className="primary-btn" disabled>
        인증 메일 다시 보내기
      </button>

      <div className="auth-foot">
        <Link href="/signup">다른 이메일로 가입하기</Link>
      </div>
    </div>
  );
}
