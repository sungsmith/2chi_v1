"use client";

import type { EventListItem } from "@/lib/types/application";
import { EventChip } from "./event-chip";

type Props = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: EventListItem[];
  onEventClick: (e: EventListItem) => void;
  onDayClick: (date: string) => void;
};

export function DayCell({ date, isCurrentMonth, isToday, events, onEventClick, onDayClick }: Props) {
  const iso = date.toISOString().slice(0, 10);
  return (
    <div
      onClick={() => onDayClick(iso)}
      style={{
        minHeight: 100, padding: 4,
        background: isToday ? "#fff8d6" : "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        opacity: isCurrentMonth ? 1 : 0.4,
        cursor: "pointer",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2 }}>
        {date.getDate()}
        {isToday && <span style={{ marginLeft: 4, fontWeight: 700, color: "var(--color-text-brand)" }}>(오늘)</span>}
      </div>
      {events.map((ev) => (
        <span key={ev.id} onClick={(e) => e.stopPropagation()}>
          <EventChip event={ev} onClick={() => onEventClick(ev)} />
        </span>
      ))}
    </div>
  );
}
