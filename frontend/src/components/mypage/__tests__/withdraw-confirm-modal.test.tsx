import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WithdrawConfirmModal } from "../withdraw-confirm-modal";

const withdrawMock = vi.fn();
const pushMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("@/lib/api/mypage", () => ({
  withdraw: (...args: unknown[]) => withdrawMock(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true },
    initialized: true, login: vi.fn(), logout: logoutMock, refreshUser: vi.fn(),
  }),
}));

beforeEach(() => {
  withdrawMock.mockReset();
  pushMock.mockReset();
  logoutMock.mockReset();
  sessionStorage.clear();
});

describe("WithdrawConfirmModal", () => {
  it("withdraws and triggers forced logout + redirect on success", async () => {
    withdrawMock.mockResolvedValueOnce(undefined);
    render(<WithdrawConfirmModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("현재 비밀번호"), "Pass1234!");
    await userEvent.click(screen.getByRole("button", { name: /회원 탈퇴/ }));

    await waitFor(() => expect(withdrawMock).toHaveBeenCalledWith("Pass1234!"));
    expect(logoutMock).toHaveBeenCalled();
    expect(sessionStorage.getItem("loginBanner")).toBe("withdrawn");
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("shows error on PASSWORD_MISMATCH", async () => {
    withdrawMock.mockRejectedValueOnce(new Error("현재 비밀번호가 일치하지 않아요."));
    render(<WithdrawConfirmModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("현재 비밀번호"), "Wrong!");
    await userEvent.click(screen.getByRole("button", { name: /회원 탈퇴/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("현재 비밀번호가 일치하지 않아요.");
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("disables submit button until password is entered", async () => {
    render(<WithdrawConfirmModal onClose={vi.fn()} />);
    const submit = screen.getByRole("button", { name: /회원 탈퇴/ });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText("현재 비밀번호"), "x");
    expect(submit).toBeEnabled();
  });

  it("cancel button calls onClose", async () => {
    const onClose = vi.fn();
    render(<WithdrawConfirmModal onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
