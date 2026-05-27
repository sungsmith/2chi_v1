"use client";

import { useState } from "react";
import { updateNickname } from "@/lib/api/mypage";
import type { MeProfile } from "@/lib/types/mypage";

const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9_-]{2,20}$/;

type Props = {
  currentNickname: string;
  onClose: () => void;
  onSuccess: (updated: MeProfile) => void | Promise<void>;
};

export function NicknameEditModal({ currentNickname, onClose, onSuccess }: Props) {
  const [value, setValue] = useState(currentNickname);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(undefined);

    if (value === currentNickname) {
      onClose();
      return;
    }
    if (!NICKNAME_PATTERN.test(value)) {
      setError("닉네임은 2~20자의 한글/영문/숫자 및 -, _ 만 가능해요.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateNickname(value);
      await onSuccess(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>닉네임 변경</h3>
          <button type="button" className="close" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </header>

        <div className="body">
          <div className="fld">
            <label className="lbl" htmlFor="nickname-input">닉네임 <span className="req">*</span></label>
            <input
              id="nickname-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={submitting}
              autoFocus
            />
            <div className="hint">2~20자의 한글/영문/숫자 및 - _ 만 가능해요.</div>
          </div>
          {error && <div className="error-text" role="alert">{error}</div>}
        </div>

        <footer className="actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={submitting}>취소</button>
          <button type="button" className="btn primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "저장 중..." : "저장"}
          </button>
        </footer>
      </div>
    </div>
  );
}
