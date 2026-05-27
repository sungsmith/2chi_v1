import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DangerView } from "../danger-view";

vi.mock("@/lib/api/mypage", () => ({
  withdraw: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true },
    initialized: true, login: vi.fn(), logout: vi.fn(), refreshUser: vi.fn(),
  }),
}));

describe("DangerView", () => {
  it("displays warning message about account deletion", () => {
    render(<DangerView />);
    expect(screen.getByText(/탈퇴 후 30일간 유예 기간/)).toBeInTheDocument();
  });

  it("opens WithdrawConfirmModal when '회원 탈퇴' button is clicked", async () => {
    render(<DangerView />);
    const withdrawBtn = screen.getByRole("button", { name: "회원 탈퇴" });
    expect(withdrawBtn).not.toBeDisabled();

    await userEvent.click(withdrawBtn);
    expect(screen.getByRole("heading", { name: "회원 탈퇴 확인" })).toBeInTheDocument();
  });

  it("data export button is still disabled (BE absent)", () => {
    render(<DangerView />);
    const exportBtn = screen.getByRole("button", { name: /데이터 요청/ });
    expect(exportBtn).toBeDisabled();
  });

  it("closes modal when cancel is clicked", async () => {
    render(<DangerView />);
    await userEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    expect(screen.getByRole("heading", { name: "회원 탈퇴 확인" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("heading", { name: "회원 탈퇴 확인" })).not.toBeInTheDocument();
  });
});
