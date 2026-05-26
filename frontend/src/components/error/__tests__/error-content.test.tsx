import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorContent } from "../error-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

describe("ErrorContent", () => {
  it("renders 404 message + sleep mascot", () => {
    render(<ErrorContent code={404} />);
    expect(screen.getByText(/404/)).toBeInTheDocument();
    expect(screen.getByText(/이 페이지는 더 이상 찾을 수 없어요/)).toBeInTheDocument();
    const mascot = document.querySelector(".mascot-cloud.sleep");
    expect(mascot).not.toBeNull();
  });

  it("renders 500 message + think mascot", () => {
    render(<ErrorContent code={500} />);
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/잠시 후 다시 시도해주세요/)).toBeInTheDocument();
    const mascot = document.querySelector(".mascot-cloud.think");
    expect(mascot).not.toBeNull();
  });

  it("invokes reset on 500 다시 시도 click", () => {
    const reset = vi.fn();
    render(<ErrorContent code={500} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /다시 시도/ }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
