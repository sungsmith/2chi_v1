import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverLetterMasterContent } from "../master-content";
import type { CoverLetterMaster, CoverLetterMasterSummary } from "@/lib/types/cover-letter";

const summaryMock = vi.fn();
const byTypeMock = vi.fn();
const createMock = vi.fn();
const patchMock = vi.fn();
const copyMock = vi.fn();
const deleteMock = vi.fn();
vi.mock("@/lib/api/cover-letter", () => ({
  fetchMasterSummary: (...a: unknown[]) => summaryMock(...a),
  fetchMastersByType: (...a: unknown[]) => byTypeMock(...a),
  createMaster: (...a: unknown[]) => createMock(...a),
  patchMaster: (...a: unknown[]) => patchMock(...a),
  copyMaster: (...a: unknown[]) => copyMock(...a),
  deleteMaster: (...a: unknown[]) => deleteMock(...a),
}));

const sampleMaster: CoverLetterMaster = {
  id: 1, itemType: "MOTIVATION", title: "A형 - 정량 성과",
  masterAnswer: "백엔드 개발자로서 성능에 집중해왔습니다",
  charLimitHint: 500, isDefault: true,
  createdAt: "2026-05-21T00:00:00Z", updatedAt: "2026-05-21T00:00:00Z",
};
const sampleSummary: CoverLetterMasterSummary = {
  id: 1, itemType: "MOTIVATION", title: "A형 - 정량 성과",
  charCount: 22, isDefault: true, updatedAt: "2026-05-21T00:00:00Z",
};

beforeEach(() => {
  summaryMock.mockReset();
  byTypeMock.mockReset();
  createMock.mockReset();
  patchMock.mockReset();
  copyMock.mockReset();
  deleteMock.mockReset();
});

describe("CoverLetterMasterContent", () => {
  test("로딩 후 항목 유형 리스트 + 빈 편집기", async () => {
    summaryMock.mockResolvedValue([]);
    byTypeMock.mockResolvedValue([]);
    render(<CoverLetterMasterContent />);
    expect(await screen.findByText(/지원동기/)).toBeInTheDocument();
    expect(screen.getByText(/협업 경험/)).toBeInTheDocument();
    expect(screen.getByText(/입사 후 포부/)).toBeInTheDocument();
  });

  test("기존 마스터 표시 — 제목·답변·기본 표시", async () => {
    summaryMock.mockResolvedValue([sampleSummary]);
    byTypeMock.mockResolvedValue([sampleMaster]);
    render(<CoverLetterMasterContent />);
    await waitFor(() => expect(screen.getByDisplayValue("A형 - 정량 성과")).toBeInTheDocument());
    expect(screen.getByDisplayValue(/백엔드 개발자로서/)).toBeInTheDocument();
    expect(screen.getByText(/⭐ 기본/)).toBeInTheDocument();
  });

  test("항목 유형 클릭 → 새 itemType 로 fetch", async () => {
    summaryMock.mockResolvedValue([]);
    byTypeMock.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<CoverLetterMasterContent />);
    await waitFor(() => expect(screen.getByText(/협업 경험/)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /협업 경험/ }));
    await waitFor(() => expect(byTypeMock).toHaveBeenCalledWith("TEAMWORK"));
  });

  test("새 마스터 만들기 → POST + 리스트 갱신", async () => {
    summaryMock.mockResolvedValue([]);
    byTypeMock.mockResolvedValue([]);
    createMock.mockResolvedValue({ ...sampleMaster, id: 99 });
    const user = userEvent.setup();
    render(<CoverLetterMasterContent />);
    await waitFor(() => expect(screen.getByText(/지원동기/)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /\+ 마스터 새로 만들기/ }));
    await user.type(screen.getByLabelText(/마스터 답변/), "새 답변");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
        itemType: "MOTIVATION",
        masterAnswer: "새 답변",
        isDefault: true,
      }));
    });
  });

  test("편집 + 저장 → PATCH 호출", async () => {
    summaryMock.mockResolvedValue([sampleSummary]);
    byTypeMock.mockResolvedValue([sampleMaster]);
    patchMock.mockResolvedValue(sampleMaster);
    const user = userEvent.setup();
    render(<CoverLetterMasterContent />);
    await screen.findByDisplayValue("A형 - 정량 성과");

    const titleInput = screen.getByLabelText(/제목/);
    await user.clear(titleInput);
    await user.type(titleInput, "A형 (수정됨)");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith(1, expect.objectContaining({
        title: "A형 (수정됨)",
      }));
    });
  });

  test("삭제 confirm → DELETE + newDefaultId 따라 editingId 변경", async () => {
    const second: CoverLetterMaster = { ...sampleMaster, id: 2, isDefault: false, title: "B형" };
    summaryMock.mockResolvedValue([sampleSummary, { ...sampleSummary, id: 2, isDefault: false, title: "B형" }]);
    byTypeMock.mockResolvedValue([sampleMaster, second]);
    deleteMock.mockResolvedValue({ newDefaultId: 2 });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const user = userEvent.setup();
    render(<CoverLetterMasterContent />);
    await screen.findByDisplayValue("A형 - 정량 성과");

    await user.click(screen.getByRole("button", { name: /^삭제$/ }));
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(1));
  });
});
