import { describe, it, expect } from "vitest";
import { formatRelativeKo } from "../relative-time";

describe("formatRelativeKo", () => {
  const now = new Date("2026-05-27T12:00:00Z");

  it("returns '방금 전' for under 60 seconds", () => {
    expect(formatRelativeKo(new Date("2026-05-27T11:59:30Z"), now)).toBe("방금 전");
  });

  it("returns 'N분 전' for under 60 minutes", () => {
    expect(formatRelativeKo(new Date("2026-05-27T11:55:00Z"), now)).toBe("5분 전");
  });

  it("returns 'N시간 전' for under 24 hours", () => {
    expect(formatRelativeKo(new Date("2026-05-27T08:00:00Z"), now)).toBe("4시간 전");
  });

  it("returns '어제' for 1 day", () => {
    expect(formatRelativeKo(new Date("2026-05-26T12:00:00Z"), now)).toBe("어제");
  });

  it("returns 'N일 전' for under 30 days", () => {
    expect(formatRelativeKo(new Date("2026-05-22T12:00:00Z"), now)).toBe("5일 전");
  });

  it("returns 'N개월 전' for under 12 months", () => {
    expect(formatRelativeKo(new Date("2026-02-26T12:00:00Z"), now)).toBe("3개월 전");
  });

  it("returns 'N년 전' for over a year", () => {
    expect(formatRelativeKo(new Date("2024-05-27T12:00:00Z"), now)).toBe("2년 전");
  });
});
