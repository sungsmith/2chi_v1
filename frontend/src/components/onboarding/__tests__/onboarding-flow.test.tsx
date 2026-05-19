import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingFlow } from "../onboarding-flow";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const refreshUserMock = vi.fn();
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: false },
    initialized: true,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: refreshUserMock,
  }),
}));

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  pushMock.mockReset();
  refreshUserMock.mockReset();
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

async function clickNext(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /다음/ }));
}

describe("OnboardingFlow", () => {
  test("Step 1 미선택 시 [다음] disabled", () => {
    render(<OnboardingFlow />);
    const next = screen.getByRole("button", { name: /다음/ });
    expect(next).toBeDisabled();
  });

  test("Step 3 빈 multi-select 시 [다음] disabled", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    // Step 1: 이직 준비 중 선택
    await user.click(screen.getByRole("button", { name: /이직 준비 중/ }));
    await clickNext(user);

    // Step 2: 3년차 선택 — accessible name은 "3 년차" (두 div가 공백으로 합쳐짐)
    await user.click(screen.getByRole("button", { name: "3 년차" }));
    await clickNext(user);

    // Step 3: 아무것도 선택하지 않음
    const next = screen.getByRole("button", { name: /다음/ });
    expect(next).toBeDisabled();
  });

  test("4단계 완료 + [완료] → fetch 호출 + push('/')", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    refreshUserMock.mockResolvedValueOnce(undefined);

    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /이직 준비 중/ }));
    await clickNext(user);

    await user.click(screen.getByRole("button", { name: "3 년차" }));
    await clickNext(user);

    await user.click(screen.getByRole("button", { name: /Backend/ }));
    await user.click(screen.getByRole("button", { name: /Infra \/ Cloud/ }));
    await clickNext(user);

    await user.click(screen.getByRole("button", { name: /^완료/ }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.target).toBe("JOB_CHANGE");
    expect(body.careerYear).toBe(3);
    expect(body.targetJobs).toEqual(expect.arrayContaining(["BACKEND", "INFRA_CLOUD"]));

    expect(refreshUserMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  test("API 400 응답 → 상단 알림", async () => {
    fetchMock.mockResolvedValueOnce(new Response(
      JSON.stringify({ code: "VALIDATION_FAILED", message: "입력값이 유효하지 않습니다.", traceId: "x" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    ));

    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /이직 준비 중/ }));
    await clickNext(user);
    await user.click(screen.getByRole("button", { name: "3 년차" }));
    await clickNext(user);
    await user.click(screen.getByRole("button", { name: /Backend/ }));
    await clickNext(user);
    await user.click(screen.getByRole("button", { name: /^완료/ }));

    expect(await screen.findByText(/입력값이 유효하지 않습니다/)).toBeInTheDocument();
  });

  test("[나중에] 클릭 → fetch 미호출 + push('/')", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /이직 준비 중/ }));
    await clickNext(user);
    await user.click(screen.getByRole("button", { name: "3 년차" }));
    await clickNext(user);
    await user.click(screen.getByRole("button", { name: /Backend/ }));
    await clickNext(user);
    await user.click(screen.getByRole("button", { name: /나중에/ }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
