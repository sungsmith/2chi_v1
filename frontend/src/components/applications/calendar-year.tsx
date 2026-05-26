"use client";

import type { EventListItem } from "@/lib/types/application";

type Props = {
  year: number;
  events: EventListItem[];
  onPickDate: (date: Date) => void;
};

const DOWS_SHORT = ["일", "월", "화", "수", "목", "금", "토"];

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDow(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export function CalendarYear({ year, events, onPickDate }: Props) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  // Build set of "YYYY-MM-DD" strings that have events
  const eventDates = new Set(events.map((e) => e.eventDate));

  return (
    <div className="cal-year">
      {MONTH_NAMES.map((name, idx) => {
        const monthNum = idx + 1;
        const days = getDaysInMonth(year, monthNum);
        const prevDays = getDaysInMonth(year, monthNum - 1 === 0 ? 12 : monthNum - 1);
        const startDow = getFirstDow(year, monthNum);
        const isCurrentMonth = year === todayYear && monthNum === todayMonth;

        // Count events in this month
        const prefix = `${year}-${String(monthNum).padStart(2, "0")}-`;
        const evtCount = events.filter((e) => e.eventDate.startsWith(prefix)).length;

        // Build 42-cell grid
        const cells: { num: number; mute: boolean; today: boolean; hasEvt: boolean }[] = [];
        for (let i = 0; i < 42; i++) {
          const d = i - startDow + 1;
          if (d < 1) {
            cells.push({ num: prevDays + d, mute: true, today: false, hasEvt: false });
          } else if (d > days) {
            cells.push({ num: d - days, mute: true, today: false, hasEvt: false });
          } else {
            const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isToday = isCurrentMonth && d === todayDay;
            cells.push({ num: d, mute: false, today: isToday, hasEvt: eventDates.has(dateStr) });
          }
        }

        return (
          <div
            key={idx}
            className={"cal-yr-month" + (isCurrentMonth ? " current" : "")}
            onClick={() => onPickDate(new Date(year, monthNum - 1, 1))}
          >
            <div className="nm">
              <span>{name}</span>
              {evtCount > 0 && <span className="cnt">{evtCount}건</span>}
            </div>
            <div className="cal-yr-grid">
              {DOWS_SHORT.map((d, i) => (
                <span key={d} className={"dow" + (i === 0 ? " sun" : "")}>{d}</span>
              ))}
              {cells.map((c, i) => (
                <span
                  key={i}
                  className={
                    "d" +
                    (c.mute ? " mute" : "") +
                    (c.today ? " today" : "") +
                    (c.hasEvt ? " has-evt" : "")
                  }
                >
                  {c.num}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
