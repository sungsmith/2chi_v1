"use client";

import { useEffect, useState } from "react";
import { patchEvent, deleteEvent } from "@/lib/api/application";
import type { EventListItem, EventType } from "@/lib/types/application";
import { EVENT_TYPE_LABEL } from "@/lib/types/application";

const EVENT_TYPES: EventType[] = ["DOC_DEADLINE","CODING_TEST","FIRST_INTERVIEW","SECOND_INTERVIEW","EXEC_INTERVIEW","NEGOTIATION","PASSED","FAILED","ETC"];

type Props = {
  event: EventListItem;
  onClose: () => void;
  onChanged: () => void;
};

export function EventEditModal({ event, onClose, onChanged }: Props) {
  const [type, setType] = useState<EventType>(event.type);
  const [date, setDate] = useState(event.eventDate);
  const [time, setTime] = useState(event.eventTime?.slice(0, 5) ?? "");
  const [memo, setMemo] = useState(event.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    try {
      await patchEvent(event.id, {
        type, eventDate: date,
        eventTime: time ? `${time}:00` : null,
        memo: memo || null,
      });
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이 일정을 삭제할까요?")) return;
    setSaving(true);
    try {
      await deleteEvent(event.id);
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
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
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>일정 편집</h3>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>
          {event.company} · {event.role}
        </p>
        {error && (
          <div role="alert" style={{
            marginBottom: 12, padding: "10px 14px",
            background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
            borderRadius: "var(--radius-md)", fontSize: 13,
          }}>{error}</div>
        )}
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>종류</label>
          <select value={type} onChange={(e) => setType(e.target.value as EventType)}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>일자</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>시간 (선택)</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>메모</label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} style={{ width: "100%" }} />
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
          <button className="btn ghost" onClick={handleDelete} disabled={saving}
            style={{ color: "var(--color-semantic-error)" }}>삭제</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" onClick={onClose} disabled={saving}>취소</button>
            <button className="btn" onClick={handleSave} disabled={saving}>저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}
