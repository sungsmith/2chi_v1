import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NicknameEditModal } from "../nickname-edit-modal";
import type { MeProfile } from "@/lib/types/mypage";

const updateNicknameMock = vi.fn();
vi.mock("@/lib/api/mypage", () => ({
  updateNickname: (...args: unknown[]) => updateNicknameMock(...args),
}));

const updatedProfile: MeProfile = {
  userId: 1, email: "a@b.com", nickname: "new_nick", role: "USER",
  onboardingCompleted: true, joinedAt: "2026-01-01T00:00:00Z",
  passwordChangedAt: "2026-01-01T00:00:00Z", plan: "free",
};

beforeEach(() => {
  updateNicknameMock.mockReset();
});

describe("NicknameEditModal", () => {
  it("submits new nickname and calls onSuccess", async () => {
    updateNicknameMock.mockResolvedValueOnce(updatedProfile);
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(<NicknameEditModal currentNickname="alice" onClose={onClose} onSuccess={onSuccess} />);

    const input = screen.getByRole("textbox", { name: /닉네임/ });
    await userEvent.clear(input);
    await userEvent.type(input, "new_nick");
    await userEvent.click(screen.getByRole("button", { name: /저장/ }));

    await waitFor(() => expect(updateNicknameMock).toHaveBeenCalledWith("new_nick"));
    expect(onSuccess).toHaveBeenCalledWith(updatedProfile);
  });

  it("shows pattern error for 1-char nickname", async () => {
    render(<NicknameEditModal currentNickname="alice" onClose={vi.fn()} onSuccess={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /닉네임/ });
    await userEvent.clear(input);
    await userEvent.type(input, "x");
    await userEvent.click(screen.getByRole("button", { name: /저장/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/2~20자/);
    expect(updateNicknameMock).not.toHaveBeenCalled();
  });

  it("closes without calling API when nickname is unchanged", async () => {
    const onClose = vi.fn();
    render(<NicknameEditModal currentNickname="alice" onClose={onClose} onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /저장/ }));

    expect(updateNicknameMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows server error message on API failure", async () => {
    updateNicknameMock.mockRejectedValueOnce(new Error("이미 사용중인 닉네임이에요."));
    render(<NicknameEditModal currentNickname="alice" onClose={vi.fn()} onSuccess={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /닉네임/ });
    await userEvent.clear(input);
    await userEvent.type(input, "bob");
    await userEvent.click(screen.getByRole("button", { name: /저장/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("이미 사용중인 닉네임이에요.");
  });

  it("cancel button calls onClose", async () => {
    const onClose = vi.fn();
    render(<NicknameEditModal currentNickname="alice" onClose={onClose} onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
