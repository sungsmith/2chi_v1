"use client";

import { useEffect, useState } from "react";
import { createEvent } from "@/lib/api/application";
import type { ApplicationSummary, EventType } from "@/lib/types/application";
import { EVENT_TYPE_LABEL } from "@/lib/types/application";

const EVENT_TYPES: EventType[] = ["DOC_DEADLINE","CODING_TEST","FIRST_INTERVIEW","SECOND_INTERVIEW","EXEC_INTERVIEW","NEGOTIATION","PASSED","FAILED","ETC"];

type Props = {
  apps: ApplicationSummary[];
  initialDate?: string;
  onClose: () => void;
  onCreated: () => void;
};

export function EventCreateModal({ apps, initialDate, onClose, onCreated }: Props) {
  const [appId, setAppId] = useState<number | null>(apps[0]?.id ?? null);
  const [type, setType] = useState<EventType>("FIRST_INTERVIEW");
  const [date, setDate] = useState(initialDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleSave() {
    if (!appId) return;
    setSaving(true);
    try {
      await createEvent(appId, {
        type, eventDate: date,
        eventTime: time ? `${time}:00` : null,
        memo: memo || null,
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
               alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--color-surface-default)", borderRadius: "var(--radius-lg)",
                 padding: 24, width: "min(480px, 90vw)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>+ 일정 추가</h3>
        {error && (
          <div role="alert" style={{
            marginBottom: 12, padding: "10px 14px",
            background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
            borderRadius: "var(--radius-md)", fontSize: 13,
          }}>{error}</div>
        )}
        {apps.length === 0 ? (
          <>
            <p style={{ marginBottom: 16 }}>
              지원이 없어요. 공고 카드에서 ✅지원함 을 먼저 눌러주세요.
            </p>
            <div style={{ textAlign: "right" }}>
              <button className="btn" onClick={onClose}>닫기</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>지원</label>
              <select value={appId ?? ""} onChange={(e) => setAppId(Number(e.target.value))}>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>{a.company} — {a.role}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>종류</label>
              <select value={type} onChange={(e) => setType(e.target.value as EventType)}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>일자</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="일자" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>시간 (선택)</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>메모</label>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} style={{ width: "100%" }} />
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn ghost" onClick={onClose} disabled={saving}>취소</button>
              <button className="btn" onClick={handleSave} disabled={saving || !appId || !date}>추가</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
