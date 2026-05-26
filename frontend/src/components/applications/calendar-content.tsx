"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarLegend } from "./calendar-legend";
import { CalendarMonth } from "./calendar-month";
import { CalendarYear } from "./calendar-year";
import { CalendarWeek } from "./calendar-week";
import { CalendarDay } from "./calendar-day";
import { EventEditModal } from "./event-edit-modal";
import { EventCreateModal } from "./event-create-modal";
import { fetchEvents, fetchApplications } from "@/lib/api/application";
import { toLocalIso } from "@/lib/utils/date";
import type { EventListItem, ApplicationSummary } from "@/lib/types/application";

type Props = { month?: string };
type View = "year" | "month" | "week" | "day";

const DOWS = ["일", "월", "화", "수", "목", "금", "토"];

function parseMonth(m: string | undefined): { year: number; month: number } {
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    return { year: y, month: mo };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthBounds(year: number, month: number): { from: string; to: string } {
  // 그리드 시작 = 월 1일의 이전 일요일, 끝 = + 41일.
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 41);
  return { from: toLocalIso(start), to: toLocalIso(end) };
}

function todayLabel(): string {
  const n = new Date();
  return `오늘 ${n.getMonth() + 1}월 ${n.getDate()}일`;
}

export function CalendarContent({ month }: Props) {
  const router = useRouter();
  const { year, month: mo } = parseMonth(month);
  const [view, setView] = useState<View>("month");
  const [events, setEvents] = useState<EventListItem[] | null>(null);
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const { from, to } = monthBounds(year, mo);
    Promise.all([fetchEvents(from, to), fetchApplications()])
      .then(([evs, as]) => { setEvents(evs); setApps(as); })
      .catch((e) => setError(e instanceof Error ? e.message : "캘린더를 불러오지 못했어요."));
  }, [year, mo, refreshTick]);

  function navMonth(delta: number) {
    const d = new Date(year, mo - 1 + delta, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    router.replace(`/applications/calendar?month=${y}-${m}`);
  }

  function navToday() {
    router.replace("/applications/calendar");
  }

  function toolbarMonthLabel() {
    if (view === "year") return `${year}년`;
    return `${year}년 ${mo}월`;
  }

  return (
    <>
      <section className="ap-head">
        <div>
          <h1>캘린더</h1>
          <div className="sub">전형 단계별 색상으로 일정을 한눈에 확인하세요.</div>
        </div>
        <div className="actions">
          <button
            className="btn secondary sm"
            onClick={() => { setCreateInitialDate(undefined); setCreateOpen(true); }}
          >
            <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-1px", marginRight: 4 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            일정 추가
          </button>
        </div>
      </section>

      <CalendarLegend />

      <section className="cal-card">
        <div className="cal-toolbar">
          <span className="month">
            {toolbarMonthLabel()}
            <span className="today">{todayLabel()}</span>
          </span>
          <div className="nav">
            <button aria-label="이전 달" onClick={() => navMonth(-1)}>
              <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button aria-label="다음 달" onClick={() => navMonth(1)}>
              <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="right">
            <button className="btn ghost sm" onClick={navToday}>
              <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-1px", marginRight: 4 }}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
              오늘
            </button>
            <div className="seg">
              <button className={view === "year"  ? "active" : ""} onClick={() => setView("year")}>연</button>
              <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>월</button>
              <button className={view === "week"  ? "active" : ""} onClick={() => setView("week")}>주</button>
              <button className={view === "day"   ? "active" : ""} onClick={() => setView("day")}>일</button>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" style={{
            padding: "10px 14px",
            background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
            borderRadius: "var(--radius-md)", fontSize: 13,
          }}>{error}</div>
        )}

        {view === "month" && (
          events === null ? (
            <div style={{ color: "var(--color-text-secondary)", padding: 16 }}>불러오는 중…</div>
          ) : (
            <CalendarMonth
              year={year}
              month={mo}
              events={events}
              dows={DOWS}
              onOpenEvt={setEditingEvent}
              onDayClick={(d) => { setCreateInitialDate(d); setCreateOpen(true); }}
            />
          )
        )}
        {view === "year"  && (
          <CalendarYear
            year={year}
            events={events ?? []}
            onPickDate={(d) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              router.replace(`/applications/calendar?month=${y}-${m}`);
              setView("month");
            }}
          />
        )}
        {view === "week"  && (
          <CalendarWeek
            date={new Date(year, mo - 1, 1)}
            events={events ?? []}
            onOpenEvt={() => {}}
          />
        )}
        {view === "day"   && (
          <CalendarDay
            date={new Date(year, mo - 1, 1)}
            events={events ?? []}
            onOpenEvt={() => {}}
          />
        )}
      </section>

      {editingEvent && (
        <EventEditModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onChanged={() => setRefreshTick((t) => t + 1)}
        />
      )}
      {createOpen && (
        <EventCreateModal
          apps={apps}
          initialDate={createInitialDate}
          onClose={() => setCreateOpen(false)}
          onCreated={() => setRefreshTick((t) => t + 1)}
        />
      )}
    </>
  );
}
