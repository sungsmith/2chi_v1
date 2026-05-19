import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AppLayout from "../layout";

const replaceMock = vi.fn();
let mockPathname = "/me";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => mockPathname,
}));

let authMock = {
  user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true },
  initialized: true,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
};
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => authMock,
}));

beforeEach(() => {
  replaceMock.mockReset();
  mockPathname = "/me";
  authMock = {
    user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true },
    initialized: true,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };
});

describe("AppLayout", () => {
  test("인증된 사용자 → children 렌더", () => {
    render(<AppLayout><div data-testid="child">hi</div></AppLayout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  test("비로그인 사용자 → /login?from=... 리다이렉트", () => {
    authMock = { ...authMock, user: null };
    mockPathname = "/applications";
    render(<AppLayout><div>hi</div></AppLayout>);
    expect(replaceMock).toHaveBeenCalledWith("/login?from=%2Fapplications");
  });

  test("초기화 전(initialized=false) → 깜빡임 없이 null", () => {
    authMock = { ...authMock, initialized: false, user: null };
    const { container } = render(<AppLayout><div>hi</div></AppLayout>);
    expect(container.firstChild).toBeNull();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
