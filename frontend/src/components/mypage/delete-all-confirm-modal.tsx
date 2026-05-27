"use client";

import { useState } from "react";
import { deleteAllNotifications } from "@/lib/api/notification";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export function DeleteAllConfirmModal({ onClose, onSuccess }: Props) {
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(undefined);
    setSubmitting(true);
    try {
      await deleteAllNotifications();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <h3>알림 전체 삭제</h3>
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
              알림 전체 삭제
            </div>
            <div>모든 알림이 영구 삭제됩니다. 이 작업은 되돌릴 수 없어요.</div>
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
          <button type="button" className="btn danger sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "삭제 중..." : "전체 삭제"}
          </button>
        </footer>
      </div>
    </div>
  );
}
