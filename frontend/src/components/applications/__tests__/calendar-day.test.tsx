import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CalendarDay } from "../calendar-day";

describe("CalendarDay", () => {
  const noop = vi.fn();

  it("renders day header with date, name and badge", () => {
    render(<CalendarDay date={new Date(2026, 4, 12)} events={[]} onOpenEvt={noop} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/2026년 5월/)).toBeInTheDocument();
    expect(screen.getByText(/오늘 · 일정/)).toBeInTheDocument();
  });

  it("renders events stack with title and meta", () => {
    render(<CalendarDay date={new Date(2026, 4, 12)} events={[]} onOpenEvt={noop} />);
    expect(screen.getByText("카카오 자소서 마무리 작성")).toBeInTheDocument();
    expect(screen.getByText("(주)테크컴퍼니 1차 면접 준비")).toBeInTheDocument();
  });
});
