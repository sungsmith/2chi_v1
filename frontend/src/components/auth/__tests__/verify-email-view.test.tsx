import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerifyEmailView } from "../verify-email-view";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("email=test@example.com"),
}));

describe("VerifyEmailView", () => {
  it("renders email verification waiting screen with email from query param", () => {
    render(<VerifyEmailView />);
    expect(screen.getByText(/회원가입을 도와드릴게요/)).toBeInTheDocument();
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /인증 메일 다시 보내기/ })).toBeInTheDocument();
  });

  it("disables resend button", () => {
    render(<VerifyEmailView />);
    const resendBtn = screen.getByRole("button", { name: /인증 메일 다시 보내기/ });
    expect(resendBtn).toBeDisabled();
  });
});
