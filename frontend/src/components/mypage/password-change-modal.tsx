"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { changePassword } from "@/lib/api/mypage";
import { setAccessToken } from "@/lib/api/http";

type Props = {
  onClose: () => void;
};

export function PasswordChangeModal({ onClose }: Props) {
  const router = useRouter();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(undefined);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("새 비밀번호가 일치하지 않아요.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      // forced logout — 옛 access token 이 ~15분 유효한 known limitation 회피
      setAccessToken(null);
      await logout();
      router.push("/login?password-changed=true");
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>비밀번호 변경</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div className="fld">
            <label className="lbl" htmlFor="current-password">현재 비밀번호 <span className="req" aria-hidden="true">*</span></label>
            <input
              id="current-password"
              type="password"
              className="input"
              aria-label="현재 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>
          <div className="fld">
            <label className="lbl" htmlFor="new-password">새 비밀번호 <span className="req" aria-hidden="true">*</span></label>
            <input
              id="new-password"
              type="password"
              className="input"
              aria-label="새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="fld">
            <label className="lbl" htmlFor="confirm-new-password">새 비밀번호 확인 <span className="req" aria-hidden="true">*</span></label>
            <input
              id="confirm-new-password"
              type="password"
              className="input"
              aria-label="새 비밀번호 확인"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="helper">변경 후 보안을 위해 자동으로 로그아웃돼요. 다시 로그인해주세요.</div>
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
          <button type="button" className="btn primary sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "변경 중..." : "변경"}
          </button>
        </footer>
      </div>
    </div>
  );
}
