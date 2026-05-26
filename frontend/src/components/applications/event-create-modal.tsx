"use client";

import { useEffect, useState } from "react";
import { createEvent } from "@/lib/api/application";
import { toLocalIso } from "@/lib/utils/date";
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
  const [date, setDate] = useState(initialDate ?? toLocalIso(new Date()));
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
    <div role="dialog" aria-modal="true" className="cal-evt-modal-backdrop" onClick={onClose}>
      <div className="cal-evt-modal" onClick={(e) => e.stopPropagation()}>
        <header className="head">
          <div className="title-block">
            <h3 className="ttl">일정 추가</h3>
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
          {apps.length === 0 ? (
            <p>지원이 없어요. 공고 카드에서 ✅지원함 을 먼저 눌러주세요.</p>
          ) : (
            <>
              <div className="field-row">
                <span className="k">지원</span>
                <span className="v">
                  <select value={appId ?? ""} onChange={(e) => setAppId(Number(e.target.value))}>
                    {apps.map((a) => (
                      <option key={a.id} value={a.id}>{a.company} — {a.role}</option>
                    ))}
                  </select>
                </span>
              </div>
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
            </>
          )}
        </div>

        <footer className="foot">
          <div className="right">
            <button className="btn secondary sm" onClick={onClose} disabled={saving}>취소</button>
            {apps.length > 0 && (
              <button className="btn primary sm" onClick={handleSave} disabled={saving || !appId || !date}>추가</button>
            )}
            {apps.length === 0 && (
              <button className="btn primary sm" onClick={onClose}>닫기</button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
