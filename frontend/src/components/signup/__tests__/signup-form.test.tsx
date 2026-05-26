import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "../signup-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("alert", vi.fn());
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SignupForm", () => {
  test("빈 폼 submit 시 4개 필드 에러, fetch 미호출", async () => {
    render(<SignupForm />);

    // click via fireEvent to bypass jsdom native HTML5 validation which would
    // prevent the submit event from reaching React's onSubmit handler
    fireEvent.submit(screen.getByRole("button", { name: /회원가입/ }).closest("form")!);

    expect(await screen.findByText("이메일을 입력해주세요.")).toBeInTheDocument();
    expect(screen.getByText("비밀번호를 입력해주세요.")).toBeInTheDocument();
    expect(screen.getByText("닉네임을 입력해주세요.")).toBeInTheDocument();
    expect(screen.getByText("만 14세 이상 확인이 필요합니다.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // v1 클로즈드 베타: 비밀번호 정책 완화로 비활성화.
  // 서비스 출시 시 lib/validation/signup.ts 의 password 규칙 주석 해제와 함께 활성화.
  //
  // test("비밀번호 1종만 입력 시 onBlur 검증 에러", async () => {
  //   const user = userEvent.setup();
  //   render(<SignupForm />);
  //
  //   const pw = screen.getByLabelText(/비밀번호/);
  //   await user.type(pw, "abcdefgh");
  //   await user.tab();
  //
  //   expect(screen.getByText("영문, 숫자, 특수문자 중 2종 이상을 조합해주세요.")).toBeInTheDocument();
  // });

  test("정상 입력 + 약관·개인정보 체크 후 submit 시 fetch 호출 페이로드 정확", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 1, email: "a@b.com", nickname: "alice" }),
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/이메일/), "a@b.com");
    await user.type(screen.getByLabelText(/비밀번호/), "123456");
    await user.type(screen.getByLabelText(/닉네임/), "alice");
    // auth-terms: div[role=checkbox] — click by accessible name (text content)
    await user.click(screen.getByRole("checkbox", { name: /만 14세 이상 확인/ }));
    await user.click(screen.getByRole("checkbox", { name: /서비스 이용약관/ }));
    await user.click(screen.getByRole("checkbox", { name: /개인정보 수집·이용 동의/ }));

    await user.click(screen.getByRole("button", { name: /회원가입/ }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      email: "a@b.com",
      password: "123456",
      nickname: "alice",
      ageConfirmed: true,
      consents: { terms: true, privacy: true, marketing: false },
    });
  });

  test("409 EMAIL_DUPLICATE 응답 시 이메일 필드 에러 표시", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        code: "EMAIL_DUPLICATE",
        message: "이미 가입된 이메일입니다.",
        traceId: "x",
      }),
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/이메일/), "a@b.com");
    await user.type(screen.getByLabelText(/비밀번호/), "123456");
    await user.type(screen.getByLabelText(/닉네임/), "alice");
    await user.click(screen.getByRole("checkbox", { name: /만 14세 이상 확인/ }));
    await user.click(screen.getByRole("checkbox", { name: /서비스 이용약관/ }));
    await user.click(screen.getByRole("checkbox", { name: /개인정보 수집·이용 동의/ }));
    await user.click(screen.getByRole("button", { name: /회원가입/ }));

    expect(await screen.findByText("이미 가입된 이메일입니다.")).toBeInTheDocument();
  });
});
