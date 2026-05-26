import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "../reset-password-form";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe("ResetPasswordForm", () => {
  it("starts on step 1 (email input)", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByLabelText(/이메일/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /재설정 링크 보내기/ })).toBeInTheDocument();
  });

  it("advances to step 2 (mail check) on submit", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText(/이메일/), "test@example.com");
    await user.click(screen.getByRole("button", { name: /재설정 링크 보내기/ }));
    expect(screen.getByText(/메일함을 확인해주세요/)).toBeInTheDocument();
  });

  it("advances to step 3 (new password) via demo button", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText(/이메일/), "test@example.com");
    await user.click(screen.getByRole("button", { name: /재설정 링크 보내기/ }));
    await user.click(screen.getByRole("button", { name: /메일 링크 클릭한 척/ }));
    expect(screen.getByLabelText(/새 비밀번호$|새 비밀번호 설정/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /비밀번호 변경 완료/ })).toBeInTheDocument();
  });
});
