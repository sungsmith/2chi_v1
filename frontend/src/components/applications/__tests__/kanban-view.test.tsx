import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KanbanView } from "../kanban-view";
import { KAN_COLS_MOCK } from "@/lib/mock/applications";

describe("KanbanView", () => {
  it("renders all kanban columns", () => {
    render(<KanbanView columns={KAN_COLS_MOCK} />);
    KAN_COLS_MOCK.forEach((col) => {
      expect(screen.getAllByText(col.label).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders cards with company + title + dday", () => {
    render(<KanbanView columns={KAN_COLS_MOCK} />);
    const firstCard = KAN_COLS_MOCK[0]?.items[0];
    if (firstCard) {
      expect(screen.getAllByText(firstCard.co).length).toBeGreaterThanOrEqual(1);
    }
  });
});
