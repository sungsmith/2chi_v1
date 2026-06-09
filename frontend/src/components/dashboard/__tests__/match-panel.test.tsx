import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MatchPanel } from "../match-panel";

describe("MatchPanel (v2 준비 중 플레이스홀더)", () => {
  it("renders the 준비 중 placeholder, not fake match data", () => {
    render(<MatchPanel />);
    expect(screen.getByText("매칭 분석")).toBeInTheDocument();
    expect(screen.getByText("매칭 분석을 준비하고 있어요")).toBeInTheDocument();
    expect(screen.getByText("v2 준비 중")).toBeInTheDocument();
    expect(screen.queryByText("매칭률")).not.toBeInTheDocument();
  });
});
