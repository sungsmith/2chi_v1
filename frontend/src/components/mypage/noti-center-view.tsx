"use client";

import { useEffect, useRef, useState } from "react";
import { fetchNotifications, markAllRead } from "@/lib/api/notification";
import { formatRelativeKo } from "@/lib/utils/relative-time";
import { notificationPresentation } from "@/lib/utils/notification-presentation";
import type { NotificationItem } from "@/lib/types/notification";
import { Bell, Check, Sparkle, FileEdit, Plus } from "@/components/ui/icons";
import { DeleteAllConfirmModal } from "./delete-all-confirm-modal";

const IcoMap: Record<string, React.FC<{ size?: number }>> = {
  Bell, Check, Sparkle, FileEdit, Plus,
};

function NotiRow({ entry }: { entry: NotificationItem }) {
  const { icon, tone } = notificationPresentation(entry.type);
  const Icon = IcoMap[icon] ?? Bell;
  const toneClass = tone === "default" ? "" : ` ${tone}`;
  const unread = entry.readAt === null;
  return (
    <div className={`noti-row${unread ? " unread" : ""}`}>
      <span className={`ico${toneClass}`}>
        <Icon size={14} />
      </span>
      <div className="body">
        <span className="ttl">{entry.title}</span>
      </div>
      <span className="time">{formatRelativeKo(new Date(entry.createdAt))}</span>
      <span className="unread-dot" />
    </div>
  );
}

export function NotiCenterView() {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchNotifications()
      .then((r) => setItems(r.notifications))
      .catch((e) => setError(e instanceof Error ? e.message : "알림을 불러오지 못했어요."));
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  function showTransientError(msg: string) {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setError(undefined);
      errorTimerRef.current = null;
    }, 3000);
  }

  async function handleMarkAllRead() {
    if (!items) return;
    const nowIso = new Date().toISOString();
    setItems((curr) => curr?.map((i) => i.readAt === null ? { ...i, readAt: nowIso } : i) ?? null);
    try {
      await markAllRead();
    } catch (e) {
      setItems((curr) => curr?.map((i) => i.readAt === nowIso ? { ...i, readAt: null } : i) ?? null);
      showTransientError(e instanceof Error ? e.message : "읽음 처리에 실패했어요.");
    }
  }

  if (error && !items) return <div role="alert" className="error-banner">{error}</div>;
  if (!items) return <div className="loading">불러오는 중...</div>;

  return (
    <>
      <section
        className="mp-head"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}
      >
        <div>
          <h1>알림 센터</h1>
          <div className="sub">
            최근 30일간 받은 알림이에요. 읽지 않은 알림은 페리윙클로 표시돼요.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn ghost sm" onClick={handleMarkAllRead} disabled={items.length === 0}>
            <Check size={12} /> 모두 읽음
          </button>
          <button className="btn secondary sm" onClick={() => setConfirmingDelete(true)} disabled={items.length === 0}>
            전체 삭제
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" style={{
          padding: "10px 14px",
          background: "var(--color-semantic-error-bg)",
          color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)",
          marginBottom: "12px",
          fontSize: "13px",
        }}>{error}</div>
      )}

      {items.length === 0 ? (
        <section className="noti-shell">
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-muted)" }}>
            아직 받은 알림이 없어요.
          </div>
        </section>
      ) : (
        <section className="noti-shell">
          {items.map((entry) => (
            <NotiRow key={entry.id} entry={entry} />
          ))}
        </section>
      )}

      {confirmingDelete && (
        <DeleteAllConfirmModal
          onClose={() => setConfirmingDelete(false)}
          onSuccess={() => {
            setItems([]);
            setConfirmingDelete(false);
          }}
        />
      )}
    </>
  );
}
