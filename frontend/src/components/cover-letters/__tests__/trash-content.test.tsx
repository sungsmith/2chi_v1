import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TrashContent } from "../trash-content";
import { TRASH_MOCK } from "@/lib/mock/cover-letters";

describe("TrashContent", () => {
  it("renders all trash items with title + days-until-purge", () => {
    render(<TrashContent data={TRASH_MOCK} />);
    expect(screen.getByText(/네이버 백엔드/)).toBeInTheDocument();
    expect(screen.getByText(/카카오 백엔드/)).toBeInTheDocument();
    expect(screen.getByText(/지난 버전/)).toBeInTheDocument();
    expect(screen.getByText(/22일/)).toBeInTheDocument();
  });

  it("renders empty state when no trash items", () => {
    render(<TrashContent data={[]} />);
    expect(screen.getByText(/휴지통이 비어있어요|아직 휴지통/)).toBeInTheDocument();
  });

  it("restore + delete buttons are disabled (UI mock-only)", () => {
    render(<TrashContent data={TRASH_MOCK} />);
    const restoreButtons = screen.getAllByRole("button", { name: /복원/ });
    restoreButtons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
