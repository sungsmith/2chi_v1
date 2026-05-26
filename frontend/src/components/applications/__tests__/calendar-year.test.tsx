import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CalendarYear } from "../calendar-year";

describe("CalendarYear", () => {
  it("renders 12 months", () => {
    render(<CalendarYear year={2026} events={[]} onPickDate={() => {}} />);
    expect(screen.getByText("1월")).toBeInTheDocument();
    expect(screen.getByText("12월")).toBeInTheDocument();
  });

  it("renders event count badge for months with events", () => {
    const events = [
      {
        id: 1,
        type: "document" as const,
        eventDate: "2026-05-12",
        eventTime: null,
        memo: null,
        applicationId: 1,
        company: "카카오",
        role: "백엔드",
      },
    ];
    render(<CalendarYear year={2026} events={events} onPickDate={() => {}} />);
    // 5월에 1건 이벤트 → "1건" 배지
    expect(screen.getByText("1건")).toBeInTheDocument();
  });
});
