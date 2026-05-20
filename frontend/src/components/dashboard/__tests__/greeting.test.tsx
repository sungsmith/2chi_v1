import { describe, expect, test, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { Greeting } from "../greeting";

describe("Greeting", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 20, 10, 0, 0)); // 2026-05-20 (수요일) 10:00
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test("닉네임 prop 이 h1 에 표시된다", () => {
    render(<Greeting nickname="김소미" showTags={true} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/안녕하세요, 김소미님/);
  });

  test("날짜를 'YYYY · MM · DD 요일 · 오늘의 준비 현황' 형식으로 표시한다", () => {
    render(<Greeting nickname="X" showTags={true} />);
    // 2026-05-20 은 수요일
    expect(screen.getByText(/2026 · 05 · 20 수요일 · 오늘의 준비 현황/)).toBeInTheDocument();
  });
});
