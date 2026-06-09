import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PortfolioModal } from "../portfolio-modal";

const createMock = vi.fn();
const updateMock = vi.fn();
vi.mock("@/lib/api/portfolio", () => ({
  createPortfolioLink: (...a: unknown[]) => createMock(...a),
  updatePortfolioLink: (...a: unknown[]) => updateMock(...a),
}));

beforeEach(() => { createMock.mockReset(); updateMock.mockReset(); });

describe("PortfolioModal", () => {
  it("추가 모드 — 제목·URL 입력 후 추가 시 createPortfolioLink 호출", async () => {
    createMock.mockResolvedValue({ id: 1 });
    const onSaved = vi.fn(); const onClose = vi.fn();
    render(<PortfolioModal onClose={onClose} onSaved={onSaved} />);
    fireEvent.change(screen.getByPlaceholderText("예: 내 GitHub"), { target: { value: "내 깃" } });
    fireEvent.change(screen.getByPlaceholderText("https://…"), { target: { value: "https://github.com/x" } });
    fireEvent.click(screen.getByText("추가"));
    await waitFor(() => expect(createMock).toHaveBeenCalledWith({ kind: "GITHUB", title: "내 깃", url: "https://github.com/x" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("편집 모드 — initial prefill + 저장 시 updatePortfolioLink 호출", async () => {
    updateMock.mockResolvedValue({ id: 7 });
    const onSaved = vi.fn();
    render(<PortfolioModal initial={{ id: 7, kind: "BLOG", title: "옛 제목", url: "https://old.dev", orderIndex: 0 }} onClose={vi.fn()} onSaved={onSaved} />);
    expect((screen.getByPlaceholderText("예: 내 GitHub") as HTMLInputElement).value).toBe("옛 제목");
    fireEvent.click(screen.getByText("저장"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith(7, { kind: "BLOG", title: "옛 제목", url: "https://old.dev" }));
  });

  it("잘못된 URL 이면 추가 버튼 비활성", () => {
    render(<PortfolioModal onClose={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("예: 내 GitHub"), { target: { value: "t" } });
    fireEvent.change(screen.getByPlaceholderText("https://…"), { target: { value: "ftp://x" } });
    expect(screen.getByText("추가")).toBeDisabled();
  });
});
