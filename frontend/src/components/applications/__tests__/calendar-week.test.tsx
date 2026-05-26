import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CalendarWeek } from "../calendar-week";

describe("CalendarWeek", () => {
  const noop = vi.fn();

  it("renders 7 day-of-week columns", () => {
    render(<CalendarWeek date={new Date(2026, 4, 12)} events={[]} onOpenEvt={noop} />);
    // 일 월 화 수 목 금 토
    const dows = ["일", "월", "화", "수", "목", "금", "토"];
    dows.forEach((d) => {
      expect(screen.getAllByText(d).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders time slots from 09:00 to 22:00", () => {
    render(<CalendarWeek date={new Date(2026, 4, 12)} events={[]} onOpenEvt={noop} />);
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("22:00")).toBeInTheDocument();
  });
});
