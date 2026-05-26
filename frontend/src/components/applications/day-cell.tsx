"use client";

import type { EventListItem } from "@/lib/types/application";
import { EVENT_TYPE_LABEL } from "@/lib/types/application";
import { toLocalIso } from "@/lib/utils/date";

// Map EventType → cal-evt stage modifier class
const EVENT_TYPE_STAGE_CLASS: Record<string, string> = {
  DOC_DEADLINE: "doc",
  CODING_TEST: "code",
  FIRST_INTERVIEW: "int1",
  SECOND_INTERVIEW: "int2",
  EXEC_INTERVIEW: "exec",
  NEGOTIATION: "exec",
  PASSED: "ok",
  FAILED: "fail",
  ETC: "",
};

type Props = {
  date: Date;
  dow: number; // 0=Sun … 6=Sat
  isCurrentMonth: boolean;
  isToday: boolean;
  events: EventListItem[];
  onEventClick: (e: EventListItem) => void;
  onDayClick: (date: string) => void;
};

export function DayCell({ date, dow, isCurrentMonth, isToday, events, onEventClick, onDayClick }: Props) {
  const iso = toLocalIso(date);
  return (
    <div
      className={"cal-day" + (!isCurrentMonth ? " mute" : "") + (isToday ? " today" : "")}
      onClick={() => onDayClick(iso)}
    >
      <span className={"num" + (dow === 0 ? " sun" : dow === 6 ? " sat" : "")}>{date.getDate()}</span>
      {events.slice(0, 2).map((ev) => (
        <div
          key={ev.id}
          className={"cal-evt " + (EVENT_TYPE_STAGE_CLASS[ev.type] ?? "")}
          onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
        >
          <span className="time">{ev.eventTime ? ev.eventTime.slice(0, 5) : ""}</span>
          <span>{EVENT_TYPE_LABEL[ev.type]} {ev.company}</span>
        </div>
      ))}
      {events.length > 2 && (
        <div className="cal-evt more">+ {events.length - 2}건 더보기</div>
      )}
    </div>
  );
}
