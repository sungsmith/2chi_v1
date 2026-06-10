import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PortfolioView } from "../portfolio-view";

const fetchMock = vi.fn();
const deleteMock = vi.fn();
vi.mock("@/lib/api/portfolio", () => ({
  fetchPortfolioLinks: (...a: unknown[]) => fetchMock(...a),
  deletePortfolioLink: (...a: unknown[]) => deleteMock(...a),
  createPortfolioLink: vi.fn(),
  updatePortfolioLink: vi.fn(),
}));

const filesMock = vi.fn();
const fileDeleteMock = vi.fn();
vi.mock("@/lib/api/portfolio-file", () => ({
  fetchPortfolioFiles: (...a: unknown[]) => filesMock(...a),
  uploadPortfolioFile: vi.fn().mockResolvedValue({ id: 1 }),
  getPortfolioFileDownloadUrl: vi.fn().mockResolvedValue("http://x/y"),
  deletePortfolioFile: (...a: unknown[]) => fileDeleteMock(...a),
}));

beforeEach(() => {
  fetchMock.mockReset();
  deleteMock.mockReset();
  filesMock.mockReset();
  fileDeleteMock.mockReset();
  filesMock.mockResolvedValue([]);
});

describe("PortfolioView", () => {
  it("빈 상태 안내", async () => {
    fetchMock.mockResolvedValue([]);
    render(<PortfolioView />);
    expect(await screen.findByText(/아직 등록된 포트폴리오가 없어요/)).toBeInTheDocument();
  });

  it("링크 목록 렌더 (제목·URL)", async () => {
    fetchMock.mockResolvedValue([
      { id: 1, kind: "GITHUB", title: "내 깃허브", url: "https://github.com/somi", orderIndex: 0 },
      { id: 2, kind: "BLOG", title: "기술 블로그", url: "https://somi.dev", orderIndex: 1 },
    ]);
    render(<PortfolioView />);
    expect(await screen.findByText("내 깃허브")).toBeInTheDocument();
    expect(screen.getByText("기술 블로그")).toBeInTheDocument();
    expect(screen.getByText("https://github.com/somi")).toBeInTheDocument();
  });

  it("삭제 버튼 → deletePortfolioLink 호출", async () => {
    fetchMock.mockResolvedValue([{ id: 9, kind: "OTHER", title: "x", url: "https://x.com", orderIndex: 0 }]);
    deleteMock.mockResolvedValue(undefined);
    render(<PortfolioView />);
    await screen.findByText("x");
    fireEvent.click(screen.getByLabelText("삭제"));
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(9));
  });

  it("파일 업로드 버튼 활성화", async () => {
    fetchMock.mockResolvedValue([]);
    render(<PortfolioView />);
    await screen.findByText(/아직 등록된 포트폴리오가 없어요/);
    expect(screen.getByText(/파일 업로드/)).not.toBeDisabled();
  });

  it("파일 목록 렌더 + 업로드 버튼 활성화", async () => {
    fetchMock.mockResolvedValue([]);
    filesMock.mockResolvedValue([{ id: 1, filename: "이력서.pdf", contentType: "application/pdf", sizeBytes: 2516582, createdAt: "2026-06-10T00:00:00Z" }]);
    render(<PortfolioView />);
    expect(await screen.findByText("이력서.pdf")).toBeInTheDocument();
    expect(screen.getByText("2.4MB")).toBeInTheDocument();
    expect(screen.getByText(/파일 업로드/)).not.toBeDisabled();
  });

  it("파일 삭제 → deletePortfolioFile 호출", async () => {
    fetchMock.mockResolvedValue([]);
    filesMock.mockResolvedValue([{ id: 9, filename: "a.pdf", contentType: "application/pdf", sizeBytes: 1024, createdAt: "2026-06-10T00:00:00Z" }]);
    fileDeleteMock.mockResolvedValue(undefined);
    render(<PortfolioView />);
    await screen.findByText("a.pdf");
    fireEvent.click(screen.getByLabelText("파일 삭제"));
    await waitFor(() => expect(fileDeleteMock).toHaveBeenCalledWith(9));
  });
});
