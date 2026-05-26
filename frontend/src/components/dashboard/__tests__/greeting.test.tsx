import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Greeting } from "../greeting";

describe("Greeting", () => {
  test("닉네임 prop 이 h1 에 표시된다", () => {
    render(<Greeting nickname="김소미" showTags={true} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/안녕하세요, 김소미님/);
  });

  test("renders memo-paper aside with mascot wave + 오늘의 한 줄", () => {
    render(<Greeting nickname="소미" showTags={true} todayQuote="이번 주는 1차 면접 두 곳,\n차근히 준비해봐요." />);
    const aside = document.querySelector("aside.greet-aside.memo-paper");
    expect(aside).not.toBeNull();
    expect(aside?.querySelector(".tape.mint")).not.toBeNull();
    expect(aside?.querySelector(".mascot-cloud.wave, .mascot-cloud.md.wave")).not.toBeNull();
    expect(aside?.textContent).toContain("오늘의 한 줄");
  });
});
