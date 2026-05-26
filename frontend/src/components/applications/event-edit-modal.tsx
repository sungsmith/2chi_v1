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
    <div role="dialog" aria-modal="true" className="cal-evt-modal-backdrop" onClick={onClose}>
      <div className="cal-evt-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <div className="title-block">
            <h3 className="ttl">일정 편집</h3>
            <div className="meta">
              <span className="co">{event.company}</span>
              <span className="sep" />
              <span>{event.role}</span>
            </div>
          </div>
          <button className="close" aria-label="닫기" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
            </svg>
          </button>
        </header>

        <div className="body">
          {error && (
            <div role="alert" style={{
              padding: "10px 14px",
              background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
              borderRadius: "var(--radius-md)", fontSize: 13,
            }}>{error}</div>
          )}
          <div className="field-row">
            <span className="k">종류</span>
            <span className="v">
              <select value={type} onChange={(e) => setType(e.target.value as EventType)}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>)}
              </select>
            </span>
          </div>
          <div className="field-row">
            <span className="k">일자</span>
            <span className="v">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="일자" />
            </span>
          </div>
          <div className="field-row">
            <span className="k">시간 (선택)</span>
            <span className="v">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </span>
          </div>
          <div className="field-row">
            <span className="k">메모</span>
            <span className="v">
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} style={{ width: "100%" }} />
            </span>
          </div>
        </div>

        <footer className="foot">
          <div className="left">
            <button className="btn-danger" onClick={handleDelete} disabled={saving}>삭제</button>
          </div>
          <div className="right">
            <button className="btn secondary sm" onClick={onClose} disabled={saving}>취소</button>
            <button className="btn primary sm" onClick={handleSave} disabled={saving}>저장</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
