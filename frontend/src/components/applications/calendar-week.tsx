"use client";

import type { EventListItem } from "@/lib/types/application";

type Props = {
  date: Date;
  events: EventListItem[];
  onOpenEvt: (evt: { title: string; dateLabel: string; time?: string; stage?: string }) => void;
};

const DOWS = ["일", "월", "화", "수", "목", "금", "토"];

// Mock week data matching mock JSX (line 281-334)
const MOCK_EVENTS = [
  { dow: 1, start: 10,    dur: 2,   stage: "code", title: "네이버 코딩테스트",   time: "10:00 – 12:00" },
  { dow: 2, start: 14,    dur: 1.5, stage: "int1", title: "(주)테크컴퍼니 1차",  time: "14:00 – 15:30" },
  { dow: 3, start: 23.98, dur: 0.5, stage: "doc",  title: "카카오 서류마감",     time: "23:59" },
  { dow: 5, start: 16,    dur: 1.5, stage: "exec", title: "토스 임원면접",       time: "16:00 – 17:30" },
  { dow: 1, start: 18.5,  dur: 1,   stage: "int2", title: "사전 면접 스터디",   time: "18:30 – 19:30" },
];

const DATES = [10, 11, 12, 13, 14, 15, 16];
const DAY_START = 9;
const HOURS = Array.from({ length: 14 }, (_, i) => DAY_START + i); // 9 → 22
const CELL_HEIGHT = 48;

export function CalendarWeek({ date: _date, events: _events, onOpenEvt }: Props) {
  return (
    <div className="cal-week">
      <div className="cal-week-head">
        <div className="corner" />
        {DOWS.map((d, i) => (
          <div
            key={d}
            className={
              "col-h" +
              (i === 0 ? " sun" : i === 6 ? " sat" : "") +
              (i === 2 ? " today" : "")
            }
          >
            <span className="dow">{d}</span>
            <span className="dd">{DATES[i]}</span>
          </div>
        ))}
      </div>
      <div className="cal-week-grid">
        <div className="time-col">
          {HOURS.map((h) => (
            <div key={h} className="time-cell">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {DOWS.map((d, i) => (
          <div
            key={i}
            className={"cal-week-day" + (i === 2 ? " today" : "")}
            style={{ height: HOURS.length * CELL_HEIGHT }}
          >
            {MOCK_EVENTS.filter((e) => e.dow === i).map((e, idx) => {
              const top = (e.start - DAY_START) * CELL_HEIGHT;
              const height = Math.max(28, e.dur * CELL_HEIGHT - 4);
              return (
                <div
                  key={idx}
                  className={"evt " + e.stage}
                  style={{ top, height }}
                  onClick={() =>
                    onOpenEvt({
                      ...e,
                      dateLabel: `2026.05.${10 + e.dow} (${DOWS[e.dow]})`,
                    })
                  }
                >
                  <span className="time">{e.time}</span>
                  <span className="ttl">{e.title}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
