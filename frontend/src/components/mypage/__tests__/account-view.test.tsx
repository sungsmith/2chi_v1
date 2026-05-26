import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AccountView } from "../account-view";
import { ACCOUNT_MOCK } from "@/lib/mock/mypage";

describe("AccountView", () => {
  it("displays email and nickname from data prop", () => {
    render(<AccountView data={ACCOUNT_MOCK} />);
    expect(screen.getByText(ACCOUNT_MOCK.email)).toBeInTheDocument();
    expect(screen.getByText(ACCOUNT_MOCK.nickname)).toBeInTheDocument();
  });

  it("all interactive elements are disabled (BE absent)", () => {
    render(<AccountView data={ACCOUNT_MOCK} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
