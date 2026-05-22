"use client";

import { ApplicationsHeader } from "./applications-header";

type Props = {
  year: number;
  month: number;  // 1-12
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
};

export function CalendarHeader({ year, month, onPrev, onNext, onToday, onAddEvent }: Props) {
  return (
    <>
      <ApplicationsHeader />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn ghost" style={{ fontSize: 13 }} onClick={onPrev} aria-label="이전 달">‹</button>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{year}년 {month}월</h3>
          <button className="btn ghost" style={{ fontSize: 13 }} onClick={onNext} aria-label="다음 달">›</button>
          <button className="btn ghost" style={{ fontSize: 12, marginLeft: 8 }} onClick={onToday}>오늘</button>
        </div>
        <button className="btn" onClick={onAddEvent} style={{ fontSize: 13 }}>+ 일정 추가</button>
      </div>
    </>
  );
}
