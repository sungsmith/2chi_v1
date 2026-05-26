import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DangerView } from "../danger-view";

describe("DangerView", () => {
  it("displays warning message about account deletion", () => {
    render(<DangerView />);
    expect(screen.getByText(/탈퇴 후 30일간 유예 기간/)).toBeInTheDocument();
  });

  it("all interactive elements are disabled (BE absent)", () => {
    render(<DangerView />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
