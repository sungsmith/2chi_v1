"use client";

import type { EventListItem } from "@/lib/types/application";
import { DayCell } from "./day-cell";

type Props = {
  year: number;
  month: number;  // 1-12
  events: EventListItem[];
  onEventClick: (e: EventListItem) => void;
  onDayClick: (date: string) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarGrid({ year, month, events, onEventClick, onDayClick }: Props) {
  // 첫째 날 (0-base month) + 그리드 시작 (이전 일요일)
  const firstDay = new Date(year, month - 1, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 42 셀
  const cells: Array<{ date: Date; isCurrent: boolean; isToday: boolean; events: EventListItem[] }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const isCurrent = d.getMonth() === month - 1;
    const isToday = d.getTime() === today.getTime();
    const dayEvents = events.filter((ev) => ev.eventDate === iso);
    cells.push({ date: d, isCurrent, isToday, events: dayEvents });
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 1 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{
            padding: 6, textAlign: "center", fontSize: 11, fontWeight: 700,
            color: "var(--color-text-secondary)", background: "var(--color-surface-subtle, #f8f8f8)",
          }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {cells.map((c, i) => (
          <DayCell key={i}
            date={c.date}
            isCurrentMonth={c.isCurrent}
            isToday={c.isToday}
            events={c.events}
            onEventClick={onEventClick}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
}
