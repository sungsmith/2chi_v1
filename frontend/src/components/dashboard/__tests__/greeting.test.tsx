import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Greeting } from "../greeting";

describe("Greeting", () => {
  test("닉네임 prop 이 h1 에 표시된다", () => {
    render(<Greeting nickname="김소미" tags={[]} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/안녕하세요, 김소미님/);
  });

  test("tags 가 있으면 greet-tag 로 렌더, 없으면 미표시", () => {
    const { rerender } = render(<Greeting nickname="소미" tags={[{ label: "백엔드" }, { label: "2년차", tone: "mint" }]} />);
    expect(screen.getByText("백엔드")).toBeInTheDocument();
    expect(screen.getByText("2년차")).toBeInTheDocument();
    rerender(<Greeting nickname="소미" tags={[]} />);
    expect(screen.queryByText("백엔드")).not.toBeInTheDocument();
    expect(document.querySelector(".greet-tags")).toBeNull();
  });

  test("renders memo-paper aside with mascot wave + 오늘의 한 줄", () => {
    render(<Greeting nickname="소미" tags={[]} todayQuote="이번 주는 1차 면접 두 곳,\n차근히 준비해봐요." />);
    const aside = document.querySelector("aside.greet-aside.memo-paper");
    expect(aside).not.toBeNull();
    expect(aside?.querySelector(".tape.mint")).not.toBeNull();
    expect(aside?.querySelector(".mascot-cloud.wave, .mascot-cloud.md.wave")).not.toBeNull();
    expect(aside?.textContent).toContain("오늘의 한 줄");
  });
});
