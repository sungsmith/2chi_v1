"use client";

import type { EventListItem } from "@/lib/types/application";

type Props = {
  date: Date;
  events: EventListItem[];
  onOpenEvt: (evt: { title: string; dateLabel: string; time?: string; stage?: string }) => void;
};

const Ico = {
  Check: ({ size = 10 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// Mock day data matching mock JSX (line 335-401) — 5/12 (수) today
const MOCK_EVENTS = [
  { start: 10,   dur: 1,   stage: "doc",  title: "카카오 자소서 마무리 작성",       meta: "혼자 작업 · 매칭률 72%",                      time: "10:00 – 11:00" },
  { start: 14,   dur: 1.5, stage: "int1", title: "(주)테크컴퍼니 1차 면접 준비",    meta: "PRAR 답변 정리 · 모의 면접 30분 포함",          time: "14:00 – 15:30" },
  { start: 19,   dur: 1.5, stage: "code", title: "네이버 코딩테스트 모의 풀이",     meta: "실전 대비 · 알고리즘 2문항",                    time: "19:00 – 20:30" },
  { start: 23.5, dur: 0.5, stage: "doc",  title: "카카오 서류 제출 마감",           meta: "23:59까지 제출",                                time: "23:59" },
];

const CHECKLIST = [
  { done: true,  label: "아침 09:00 — 일정 검토" },
  { done: true,  label: "카카오 공고 키워드 재확인" },
  { done: false, label: "PRAR 답변 한 번 더 읽기" },
  { done: false, label: "코딩테스트 알고리즘 워밍업" },
];

const DAY_START = 9;
const HOURS = Array.from({ length: 16 }, (_, i) => DAY_START + i); // 9 → 24
const CELL_HEIGHT = 48;

export function CalendarDay({ date: _date, events: _events, onOpenEvt }: Props) {
  return (
    <div className="cal-day-view">
      <div className="cal-day-main">
        <div className="cal-day-head">
          <span className="dd">12</span>
          <span className="nm">2026년 5월 화요일</span>
          <span className="badge">오늘 · 일정 4건</span>
        </div>
        <div className="cal-day-grid">
          <div className="time-col">
            {HOURS.map((h) => (
              <div key={h} className="time-cell">
                {String(h % 24).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          <div className="cal-day-track" style={{ height: HOURS.length * CELL_HEIGHT }}>
            {MOCK_EVENTS.map((e, idx) => {
              const top = (e.start - DAY_START) * CELL_HEIGHT;
              const height = Math.max(72, e.dur * CELL_HEIGHT - 6);
              return (
                <div
                  key={idx}
                  className={"evt " + e.stage}
                  style={{ top, height }}
                  onClick={() =>
                    onOpenEvt({
                      ...e,
                      dateLabel: "2026.05.12 (화)",
                    })
                  }
                >
                  <span className="time">{e.time}</span>
                  <span className="ttl">{e.title}</span>
                  <span className="meta">{e.meta}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="cal-day-rail">
        <span className="ttl">오늘의 요약</span>
        <div className="summary">
          <div className="row"><span className="k">일정</span><span className="v">4건</span></div>
          <div className="row"><span className="k">중요 마감</span><span className="v" style={{ color: "var(--color-pink-500)" }}>1건</span></div>
          <div className="row"><span className="k">면접 준비</span><span className="v">1.5시간</span></div>
          <div className="row"><span className="k">자소서 작성</span><span className="v">1시간</span></div>
        </div>
        <span className="ttl">체크리스트</span>
        <div className="checklist">
          {CHECKLIST.map((item, idx) => (
            <div key={idx} className={"check-item" + (item.done ? " on" : "")}>
              <span className="box">{item.done && <Ico.Check size={10} />}</span>
              <span className="label">{item.label}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
