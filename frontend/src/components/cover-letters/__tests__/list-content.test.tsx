import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CoverLetterListContent } from "../list-content";

const groupedMock = vi.fn();
vi.mock("@/lib/api/cover-letter", () => ({
  fetchVariantsGrouped: (...a: unknown[]) => groupedMock(...a),
}));

beforeEach(() => { groupedMock.mockReset(); });

describe("CoverLetterListContent", () => {
  test("빈 상태 — 안내 문구", async () => {
    groupedMock.mockResolvedValue([]);
    render(<CoverLetterListContent />);
    await waitFor(() => expect(screen.getByText(/아직 작성한 자소서가 없어요/)).toBeInTheDocument());
  });

  test("회사별 그룹 + variant 카드 렌더링", async () => {
    groupedMock.mockResolvedValue([
      {
        posting: { id: 1, company: "(주)테크컴퍼니", title: "백엔드" },
        variants: [
          { id: 10, itemType: "MOTIVATION", question: "Q1", charLimit: 500, charCount: 480, status: "COMPLETED", updatedAt: "2026-05-21T10:00:00Z" },
          { id: 11, itemType: "ACHIEVEMENT", question: "Q2", charLimit: 600, charCount: 320, status: "DRAFT", updatedAt: "2026-05-20T10:00:00Z" },
        ],
      },
    ]);
    render(<CoverLetterListContent />);
    expect(await screen.findByText("(주)테크컴퍼니")).toBeInTheDocument();
    expect(screen.getByText(/지원동기/)).toBeInTheDocument();
    expect(screen.getByText(/성취 경험/)).toBeInTheDocument();
    expect(screen.getByText(/⭐ 완료/)).toBeInTheDocument();
    expect(screen.getByText(/📝 임시/)).toBeInTheDocument();
    expect(screen.getByText(/480\/500자/)).toBeInTheDocument();
  });
});
