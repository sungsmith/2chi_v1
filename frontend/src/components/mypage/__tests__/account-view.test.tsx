import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountView } from "../account-view";
import type { MeProfile } from "@/lib/types/mypage";

const fetchMeMock = vi.fn();
const refreshUserMock = vi.fn();

vi.mock("@/lib/api/mypage", () => ({
  fetchMe: (...args: unknown[]) => fetchMeMock(...args),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: 1, email: "alice@example.com", nickname: "alice", onboardingCompleted: true },
    initialized: true,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: refreshUserMock,
  }),
}));

const profile: MeProfile = {
  userId: 1,
  email: "alice@example.com",
  nickname: "alice",
  role: "USER",
  onboardingCompleted: true,
  joinedAt: "2026-01-01T00:00:00Z",
  passwordChangedAt: "2026-01-01T00:00:00Z",
  plan: "free",
};

beforeEach(() => {
  fetchMeMock.mockReset();
  refreshUserMock.mockReset();
});

describe("AccountView", () => {
  it("renders profile data after fetch", async () => {
    fetchMeMock.mockResolvedValueOnce(profile);
    render(<AccountView />);

    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("shows 'never-changed' hint when passwordChangedAt === joinedAt", async () => {
    fetchMeMock.mockResolvedValueOnce(profile);
    render(<AccountView />);

    expect(await screen.findByText(/가입 후 변경하지 않았어요/)).toBeInTheDocument();
  });

  it("nickname '편집' button opens NicknameEditModal", async () => {
    fetchMeMock.mockResolvedValueOnce(profile);
    render(<AccountView />);
    await screen.findByText("alice");

    await userEvent.click(screen.getByRole("button", { name: /편집/ }));
    expect(screen.getByRole("heading", { name: "닉네임 변경" })).toBeInTheDocument();
  });

  it("shows error message when fetchMe fails", async () => {
    fetchMeMock.mockRejectedValueOnce(new Error("프로필을 불러오지 못했어요."));
    render(<AccountView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("프로필을 불러오지 못했어요.");
  });

  it("email change button remains disabled (v2)", async () => {
    fetchMeMock.mockResolvedValueOnce(profile);
    render(<AccountView />);
    await screen.findByText("alice@example.com");

    const emailRow = screen.getByText("이메일").closest(".mp-row")!;
    const emailBtn = emailRow.querySelector("button")!;
    expect(emailBtn).toBeDisabled();
  });
});
