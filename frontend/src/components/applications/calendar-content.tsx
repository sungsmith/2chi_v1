"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarHeader } from "./calendar-header";
import { CalendarLegend } from "./calendar-legend";
import { CalendarGrid } from "./calendar-grid";
import { EventEditModal } from "./event-edit-modal";
import { EventCreateModal } from "./event-create-modal";
import { fetchEvents, fetchApplications } from "@/lib/api/application";
import type { EventListItem, ApplicationSummary } from "@/lib/types/application";

type Props = { month?: string };

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
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export function CalendarContent({ month }: Props) {
  const router = useRouter();
  const { year, month: mo } = parseMonth(month);
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

  return (
    <section style={{ padding: 32 }}>
      <CalendarHeader
        year={year}
        month={mo}
        onPrev={() => navMonth(-1)}
        onNext={() => navMonth(1)}
        onToday={navToday}
        onAddEvent={() => { setCreateInitialDate(undefined); setCreateOpen(true); }}
      />
      <CalendarLegend />
      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}
      {events === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : (
        <CalendarGrid
          year={year} month={mo}
          events={events}
          onEventClick={setEditingEvent}
          onDayClick={(d) => { setCreateInitialDate(d); setCreateOpen(true); }}
        />
      )}
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
    </section>
  );
}
