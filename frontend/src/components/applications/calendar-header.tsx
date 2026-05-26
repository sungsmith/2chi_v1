"use client";

// CalendarHeader: ap-head section (title + add-event button).
// The cal-toolbar (month nav + view seg) lives inside CalendarContent.

type Props = {
  onAddEvent: () => void;
};

export function CalendarHeader({ onAddEvent }: Props) {
  return (
    <section className="ap-head">
      <div>
        <h1>캘린더</h1>
        <div className="sub">전형 단계별 색상으로 일정을 한눈에 확인하세요.</div>
      </div>
      <div className="actions">
        <button className="btn secondary sm" onClick={onAddEvent}>
          <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-1px", marginRight: 4 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          일정 추가
        </button>
      </div>
    </section>
  );
}
