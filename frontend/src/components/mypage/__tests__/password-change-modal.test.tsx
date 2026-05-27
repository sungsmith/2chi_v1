import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordChangeModal } from "../password-change-modal";

const changePasswordMock = vi.fn();
const pushMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("@/lib/api/mypage", () => ({
  changePassword: (...args: unknown[]) => changePasswordMock(...args),
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
  changePasswordMock.mockReset();
  pushMock.mockReset();
  logoutMock.mockReset();
});

describe("PasswordChangeModal", () => {
  it("submits and triggers forced logout + redirect on success", async () => {
    changePasswordMock.mockResolvedValueOnce(undefined);
    render(<PasswordChangeModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("현재 비밀번호"), "OldPass1!");
    await userEvent.type(screen.getByLabelText("새 비밀번호"), "NewPass2!");
    await userEvent.type(screen.getByLabelText("새 비밀번호 확인"), "NewPass2!");
    await userEvent.click(screen.getByRole("button", { name: /변경/ }));

    await waitFor(() => expect(changePasswordMock).toHaveBeenCalledWith("OldPass1!", "NewPass2!"));
    expect(logoutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login?password-changed=true");
  });

  it("shows mismatch error when new != confirm", async () => {
    render(<PasswordChangeModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("현재 비밀번호"), "OldPass1!");
    await userEvent.type(screen.getByLabelText("새 비밀번호"), "NewPass2!");
    await userEvent.type(screen.getByLabelText("새 비밀번호 확인"), "Different!");
    await userEvent.click(screen.getByRole("button", { name: /변경/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/일치하지 않/);
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("shows server error on PASSWORD_MISMATCH", async () => {
    changePasswordMock.mockRejectedValueOnce(new Error("현재 비밀번호가 일치하지 않아요."));
    render(<PasswordChangeModal onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("현재 비밀번호"), "WrongPass!");
    await userEvent.type(screen.getByLabelText("새 비밀번호"), "NewPass2!");
    await userEvent.type(screen.getByLabelText("새 비밀번호 확인"), "NewPass2!");
    await userEvent.click(screen.getByRole("button", { name: /변경/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("현재 비밀번호가 일치하지 않아요.");
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("requires all 3 fields", async () => {
    render(<PasswordChangeModal onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /변경/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/입력해주세요/);
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("cancel button calls onClose", async () => {
    const onClose = vi.fn();
    render(<PasswordChangeModal onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
