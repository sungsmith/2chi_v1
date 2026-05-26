import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PostingNewContent } from "../posting-new-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api/posting", () => ({
  createPosting: vi.fn(),
  parsePosting: vi.fn(),
}));

describe("PostingNewContent", () => {
  it("renders URL tab active by default", () => {
    render(<PostingNewContent />);
    expect(screen.getByRole("heading", { name: "채용공고 등록" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /URL 붙여넣기/ })).toHaveClass("active");
  });

  it("switches to manual tab on click", () => {
    render(<PostingNewContent />);
    const manualTab = screen.getByRole("button", { name: /직접 작성/ });
    fireEvent.click(manualTab);
    expect(manualTab).toHaveClass("active");
  });

  it("search tab is v2-locked — shows v2 badge and has locked class", () => {
    render(<PostingNewContent />);
    const searchTab = screen.getByRole("button", { name: /채용공고 검색/ });
    expect(searchTab).toHaveClass("locked");
    expect(screen.getByText(/v2/)).toBeInTheDocument();
  });
});
