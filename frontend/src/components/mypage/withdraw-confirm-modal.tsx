"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { withdraw } from "@/lib/api/mypage";

type Props = {
  onClose: () => void;
};

export function WithdrawConfirmModal({ onClose }: Props) {
  const router = useRouter();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(undefined);

    if (!currentPassword) {
      setError("현재 비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await withdraw(currentPassword);
      // forced logout — setAccessToken(null) 은 logout() 안에서 이미 처리됨
      await logout();
      // banner 정보는 logout 성공 후에만 기록 (logout 실패 시 stale key 방지).
      // URL 쿼리 대신 sessionStorage 라 layout guard 의 자동 redirect 와 경합해도
      // banner 표시가 URL 에 의존하지 않으므로 보장됨.
      sessionStorage.setItem("loginBanner", "withdrawn");
      router.push("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "탈퇴 처리에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>회원 탈퇴 확인</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div role="note" style={{
            padding: "12px 14px",
            background: "var(--color-semantic-error-bg)",
            borderRadius: "var(--radius-md)",
            borderLeft: "3px solid var(--color-semantic-error)",
            fontSize: "13px",
            lineHeight: 1.6,
            marginBottom: "12px",
          }}>
            <div style={{ fontWeight: 600, marginBottom: "6px", color: "var(--color-semantic-error)" }}>
              탈퇴 시 영구 삭제되는 데이터
            </div>
            <div>· 회원 정보 (이메일, 닉네임, 연결된 소셜 계정)</div>
            <div>· 자소서 · 경력기술 · 포트폴리오 링크</div>
            <div>· 지원 일정 · 히스토리 로그 · 알림 기록</div>
            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              30일간 휴면 상태로 유예 후 영구 삭제됩니다. 그 안에 다시 로그인하면 복구할 수 있어요.
            </div>
          </div>
          <div className="fld">
            <label className="lbl" htmlFor="withdraw-password">현재 비밀번호 <span className="req" aria-hidden="true">*</span></label>
            <input
              id="withdraw-password"
              type="password"
              className="input"
              aria-label="현재 비밀번호"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>
          {error && (
            <div role="alert" style={{
              padding: "8px 12px",
              background: "var(--color-semantic-error-bg)",
              color: "var(--color-semantic-error)",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              marginTop: "8px",
            }}>{error}</div>
          )}
        </div>

        <footer className="foot">
          <button type="button" className="btn ghost sm" onClick={onClose} disabled={submitting}>취소</button>
          <button type="button" className="btn danger sm" onClick={handleSubmit} disabled={submitting || !currentPassword}>
            {submitting ? "처리 중..." : "회원 탈퇴"}
          </button>
        </footer>
      </div>
    </div>
  );
}
