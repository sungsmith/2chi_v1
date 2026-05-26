import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HistoryView } from "../history-view";
import { HISTORY_MOCK } from "@/lib/mock/applications";

describe("HistoryView", () => {
  it("renders all history entries", () => {
    render(<HistoryView entries={HISTORY_MOCK} />);
    HISTORY_MOCK.forEach((e) => {
      expect(screen.getAllByText(e.actor).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders empty state", () => {
    render(<HistoryView entries={[]} />);
    expect(screen.getByText(/아직 활동 기록이/)).toBeInTheDocument();
  });
});
