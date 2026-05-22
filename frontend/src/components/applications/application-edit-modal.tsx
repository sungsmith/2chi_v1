"use client";

import { useEffect, useState } from "react";
import { fetchApplication, patchApplication, deleteApplication,
         createEvent, patchEvent, deleteEvent } from "@/lib/api/application";
import type { Application, ApplicationEvent, Stage, Result, EventType } from "@/lib/types/application";
import { STAGE_LABEL, RESULT_LABEL, EVENT_TYPE_LABEL } from "@/lib/types/application";

const STAGES: Stage[] = ["DOC_SUBMITTED","CODING_TEST","FIRST_INTERVIEW","SECOND_INTERVIEW","EXEC_INTERVIEW","NEGOTIATION","PASSED","FAILED"];
const RESULTS: Result[] = ["IN_PROGRESS","PASSED","FAILED","WITHDRAWN"];
const EVENT_TYPES: EventType[] = ["DOC_DEADLINE","CODING_TEST","FIRST_INTERVIEW","SECOND_INTERVIEW","EXEC_INTERVIEW","NEGOTIATION","PASSED","FAILED","ETC"];

type Props = {
  applicationId: number;
  onClose: () => void;
  onChanged: () => void;
};

export function ApplicationEditModal({ applicationId, onClose, onChanged }: Props) {
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  // 신규 event 폼
  const [newType, setNewType] = useState<EventType>("FIRST_INTERVIEW");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newMemo, setNewMemo] = useState("");

  useEffect(() => {
    fetchApplication(applicationId)
      .then(setApp)
      .catch((e) => setError(e instanceof Error ? e.message : "지원 정보를 불러오지 못했어요."));
  }, [applicationId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSaveApp() {
    if (!app) return;
    setSaving(true);
    try {
      await patchApplication(app.id, {
        currentStage: app.currentStage,
        currentResult: app.currentResult,
        memo: app.memo ?? "",
        company: app.company,
        role: app.role,
      });
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteApp() {
    if (!app) return;
    if (!confirm("이 지원을 삭제할까요? 일정도 함께 삭제됩니다.")) return;
    setSaving(true);
    try {
      await deleteApplication(app.id);
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEvent() {
    if (!app || !newDate) return;
    try {
      const created = await createEvent(app.id, {
        type: newType,
        eventDate: newDate,
        eventTime: newTime || null,
        memo: newMemo || null,
      });
      setApp({ ...app, events: [...app.events, created] });
      setNewDate(""); setNewTime(""); setNewMemo("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 추가에 실패했어요.");
    }
  }

  async function handleDeleteEvent(eventId: number) {
    if (!app) return;
    try {
      await deleteEvent(eventId);
      setApp({ ...app, events: app.events.filter((ev) => ev.id !== eventId) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "일정 삭제에 실패했어요.");
    }
  }

  return (
    <div
      role="dialog" aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface-default)", borderRadius: "var(--radius-lg)",
          padding: 24, width: "min(640px, 90vw)", maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>지원 편집</h3>
        {error && (
          <div role="alert" style={{
            marginBottom: 16, padding: "10px 14px",
            background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
            borderRadius: "var(--radius-md)", fontSize: 13,
          }}>{error}</div>
        )}
        {!app ? (
          <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
        ) : (
          <>
            <Field label="회사">
              <input value={app.company} onChange={(e) => setApp({ ...app, company: e.target.value })} />
            </Field>
            <Field label="직무">
              <input value={app.role} onChange={(e) => setApp({ ...app, role: e.target.value })} />
            </Field>
            <Field label="진행 단계">
              <select value={app.currentStage} onChange={(e) => setApp({ ...app, currentStage: e.target.value as Stage })}>
                {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
              </select>
            </Field>
            <Field label="결과">
              <select value={app.currentResult} onChange={(e) => setApp({ ...app, currentResult: e.target.value as Result })}>
                {RESULTS.map((r) => <option key={r} value={r}>{RESULT_LABEL[r]}</option>)}
              </select>
            </Field>
            <Field label="메모">
              <textarea
                value={app.memo ?? ""}
                onChange={(e) => setApp({ ...app, memo: e.target.value })}
                rows={3}
                style={{ width: "100%" }}
              />
            </Field>

            <h4 style={{ fontSize: 14, fontWeight: 700, margin: "20px 0 8px" }}>일정 ({app.events.length}개)</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {app.events.map((ev) => (
                <li key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border-default)" }}>
                  <span style={{ flex: "0 0 80px", fontSize: 11 }}>{EVENT_TYPE_LABEL[ev.type]}</span>
                  <span style={{ flex: "0 0 110px", fontSize: 12 }}>{ev.eventDate}{ev.eventTime ? ` ${ev.eventTime.slice(0, 5)}` : ""}</span>
                  <span style={{ flex: 1, fontSize: 12, color: "var(--color-text-secondary)" }}>{ev.memo ?? ""}</span>
                  <button className="btn ghost" style={{ fontSize: 11 }} onClick={() => handleDeleteEvent(ev.id)}>삭제</button>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 12, padding: 10, background: "var(--color-surface-subtle, #f8f8f8)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <select value={newType} onChange={(e) => setNewType(e.target.value as EventType)}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>)}
                </select>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} aria-label="일자" />
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} aria-label="시간 (선택)" />
                <input
                  placeholder="메모 (선택)"
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  style={{ flex: 1, minWidth: 120 }}
                />
                <button className="btn" onClick={handleAddEvent} disabled={!newDate}>+ 일정 추가</button>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn ghost" onClick={handleDeleteApp} disabled={saving}
                style={{ color: "var(--color-semantic-error)" }}>지원 삭제</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn ghost" onClick={onClose} disabled={saving}>취소</button>
                <button className="btn" onClick={handleSaveApp} disabled={saving}>저장</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}
