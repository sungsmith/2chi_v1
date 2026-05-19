import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";

const { FakeApiError, pushMock, loginMock, logoutMock } = vi.hoisted(() => {
  class FakeApiError extends Error {
    status: number;
    body: { code: string; message: string; traceId: string; metadata?: Record<string, unknown> };
    constructor(status: number, body: FakeApiError["body"]) {
      super(body.message);
      this.status = status;
      this.body = body;
    }
  }
  return {
    FakeApiError,
    pushMock: vi.fn(),
    loginMock: vi.fn(),
    logoutMock: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: null,
    initialized: true,
    login: loginMock,
    logout: logoutMock,
  }),
}));

vi.mock("@/lib/api/auth", async (orig) => {
  const real = await orig() as typeof import("@/lib/api/auth");
  return { ...real, SignupApiError: FakeApiError };
});

beforeEach(() => {
  pushMock.mockReset();
  loginMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LoginForm", () => {
  test("빈 폼 submit 시 이메일·비번 에러, login 미호출", async () => {
    render(<LoginForm />);

    const form = screen.getByRole("button", { name: /로그인/ }).closest("form")!;
    fireEvent.submit(form);

    expect(await screen.findByText("이메일을 입력해주세요.")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  test("정상 로그인 → router.push('/') 호출", async () => {
    loginMock.mockResolvedValueOnce({
      userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/이메일/), "a@b.com");
    await user.type(screen.getByLabelText(/비밀번호/), "abc123");
    await user.click(screen.getByRole("button", { name: /로그인/ }));

    expect(loginMock).toHaveBeenCalledWith("a@b.com", "abc123");
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  test("401 INVALID_CREDENTIALS → 상단 알림", async () => {
    loginMock.mockRejectedValueOnce(new FakeApiError(401, {
      code: "INVALID_CREDENTIALS",
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      traceId: "x",
    }));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/이메일/), "a@b.com");
    await user.type(screen.getByLabelText(/비밀번호/), "wrong");
    await user.click(screen.getByRole("button", { name: /로그인/ }));

    expect(await screen.findByText("이메일 또는 비밀번호가 올바르지 않습니다.")).toBeInTheDocument();
  });

  test("423 ACCOUNT_LOCKED 응답 (retryAfterSeconds=600) → '10분 후' 안내", async () => {
    loginMock.mockRejectedValueOnce(new FakeApiError(423, {
      code: "ACCOUNT_LOCKED",
      message: "계정이 잠겼습니다.",
      traceId: "x",
      metadata: { retryAfterSeconds: 600 },
    }));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/이메일/), "a@b.com");
    await user.type(screen.getByLabelText(/비밀번호/), "wrong");
    await user.click(screen.getByRole("button", { name: /로그인/ }));

    expect(await screen.findByText(/10분 후 다시 시도/)).toBeInTheDocument();
  });

  test("로그인 + onboardingCompleted=false → /onboarding 로 이동", async () => {
    loginMock.mockResolvedValueOnce({
      userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: false
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/이메일/), "a@b.com");
    await user.type(screen.getByLabelText(/비밀번호/), "abc123");
    await user.click(screen.getByRole("button", { name: /로그인/ }));

    expect(pushMock).toHaveBeenCalledWith("/onboarding");
  });
});
