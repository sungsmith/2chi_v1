"use client";

import type { EventListItem } from "@/lib/types/application";
import { EVENT_TYPE_LABEL } from "@/lib/types/application";
import { toLocalIso } from "@/lib/utils/date";

type Props = {
  year: number;
  month: number; // 1-12
  events: EventListItem[];
  dows: string[];
  onOpenEvt: (evt: EventListItem) => void;
  onDayClick: (date: string) => void;
};

// Map EventType enum → mock cal-evt stage modifier class
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

export function CalendarMonth({ year, month, events, dows, onOpenEvt, onDayClick }: Props) {
  const firstDay = new Date(year, month - 1, 1);
  const monthStartDow = firstDay.getDay();
  const monthDays = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalCells = 42;
  const cells: Array<{
    num: number;
    mute: boolean;
    dow: number;
    today: boolean;
    date: Date | null;
  }> = [];

  for (let i = 0; i < totalCells; i++) {
    const dayInMonth = i - monthStartDow + 1;
    if (dayInMonth < 1) {
      cells.push({ num: prevMonthDays + dayInMonth, mute: true, dow: i % 7, today: false, date: null });
    } else if (dayInMonth > monthDays) {
      cells.push({ num: dayInMonth - monthDays, mute: true, dow: i % 7, today: false, date: null });
    } else {
      const d = new Date(year, month - 1, dayInMonth);
      cells.push({
        num: dayInMonth,
        mute: false,
        dow: i % 7,
        today: d.getTime() === today.getTime(),
        date: d,
      });
    }
  }

  return (
    <div className="cal-grid">
      {dows.map((d, i) => (
        <div key={d} className={"cal-dow" + (i === 0 ? " sun" : i === 6 ? " sat" : "")}>{d}</div>
      ))}
      {cells.map((c, i) => {
        const cellEvents = !c.mute && c.date
          ? events.filter((ev) => ev.eventDate === toLocalIso(c.date!))
          : [];
        return (
          <div
            key={i}
            className={"cal-day" + (c.mute ? " mute" : "") + (c.today ? " today" : "")}
            onClick={() => !c.mute && c.date && onDayClick(toLocalIso(c.date))}
          >
            <span className={"num" + (c.dow === 0 ? " sun" : c.dow === 6 ? " sat" : "")}>{c.num}</span>
            {cellEvents.slice(0, 2).map((ev, idx) => (
              <div
                key={idx}
                className={"cal-evt " + (EVENT_TYPE_STAGE_CLASS[ev.type] ?? "")}
                onClick={(e) => { e.stopPropagation(); onOpenEvt(ev); }}
              >
                <span className="time">{ev.eventTime ? ev.eventTime.slice(0, 5) : ""}</span>
                <span>{EVENT_TYPE_LABEL[ev.type]} {ev.company}</span>
              </div>
            ))}
            {cellEvents.length > 2 && (
              <div className="cal-evt more">+ {cellEvents.length - 2}건 더보기</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
