import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopNav } from "../top-nav";

const pushMock = vi.fn();
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => mockPathname,
}));

type AuthUser = { userId: number; email: string; nickname: string; onboardingCompleted: boolean };
type AuthMock = {
  user: AuthUser | null;
  initialized: boolean;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  refreshUser: ReturnType<typeof vi.fn>;
};

const logoutMock = vi.fn();
let authMock: AuthMock = {
  user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true },
  initialized: true,
  login: vi.fn(),
  logout: logoutMock,
  refreshUser: vi.fn(),
};
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => authMock,
}));

beforeEach(() => {
  pushMock.mockReset();
  logoutMock.mockReset();
  mockPathname = "/";
  authMock = {
    user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true },
    initialized: true,
    login: vi.fn(),
    logout: logoutMock,
    refreshUser: vi.fn(),
  };
  vi.stubGlobal("alert", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TopNav", () => {
  test("로그인 사용자 닉네임 표시", () => {
    render(<TopNav />);
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  test("5개 메뉴 렌더 + 현재 경로(/) 의 '대시보드' active", () => {
    mockPathname = "/";
    render(<TopNav />);

    const dashboard = screen.getByRole("link", { name: /대시보드/ });
    expect(dashboard).toHaveAttribute("aria-current", "page");

    const me = screen.getByRole("link", { name: /내 정보/ });
    expect(me).not.toHaveAttribute("aria-current");
  });

  test("pathname=/me 시 '내 정보' active", () => {
    mockPathname = "/me";
    render(<TopNav />);

    const me = screen.getByRole("link", { name: /내 정보/ });
    expect(me).toHaveAttribute("aria-current", "page");

    const dashboard = screen.getByRole("link", { name: /대시보드/ });
    expect(dashboard).not.toHaveAttribute("aria-current");
  });

  test("프로필 클릭 → 드롭다운 열림, 로그아웃 클릭 → logout + /login 이동", async () => {
    logoutMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<TopNav />);

    expect(screen.queryByRole("menuitem", { name: /로그아웃/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /alice/ }));

    expect(screen.getByRole("menuitem", { name: /마이페이지/ })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /로그아웃/ }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  test("검색 버튼 클릭 → alert 호출", async () => {
    const user = userEvent.setup();
    render(<TopNav />);

    await user.click(screen.getByRole("button", { name: /검색/ }));

    expect(window.alert).toHaveBeenCalledWith("검색 기능은 곧 제공됩니다.");
  });

  test("알림 버튼 클릭 → alert 호출", async () => {
    const user = userEvent.setup();
    render(<TopNav />);

    await user.click(screen.getByRole("button", { name: /알림/ }));

    expect(window.alert).toHaveBeenCalledWith("알림 기능은 곧 제공됩니다.");
  });

  test("user=null 시 ProfileMenu 미렌더 (닉네임 부재)", () => {
    authMock = { ...authMock, user: null };
    render(<TopNav />);
    expect(screen.queryByText("alice")).not.toBeInTheDocument();
  });
});
