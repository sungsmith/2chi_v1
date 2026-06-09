import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CoverLetterListContent } from "../list-content";

const groupedMock = vi.fn();
vi.mock("@/lib/api/cover-letter", () => ({
  fetchVariantsGrouped: (...a: unknown[]) => groupedMock(...a),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => { groupedMock.mockReset(); });

describe("CoverLetterListContent", () => {
  test("마스터 잔재 제거 — 마스터 섹션·카드 없음", async () => {
    groupedMock.mockResolvedValue([]);
    render(<CoverLetterListContent />);
    await waitFor(() =>
      expect(screen.getByText(/아직 작성한 자소서가 없어요/)).toBeInTheDocument()
    );
    expect(screen.queryByText("마스터 자소서")).not.toBeInTheDocument();
    expect(screen.queryByText("새 마스터 자소서")).not.toBeInTheDocument();
    expect(document.querySelectorAll("article.cl-card.master").length).toBe(0);
  });

  test("빈 상태 — 자소서 없음 안내", async () => {
    groupedMock.mockResolvedValue([]);
    render(<CoverLetterListContent />);
    await waitFor(() =>
      expect(screen.getByText(/아직 작성한 자소서가 없어요/)).toBeInTheDocument()
    );
  });

  test("변형본 그룹 — 회사명 + 상태 배지 렌더링", async () => {
    groupedMock.mockResolvedValue([
      {
        posting: { id: 1, company: "(주)테크컴퍼니", title: "백엔드" },
        variants: [
          {
            id: 10,
            itemType: "MOTIVATION",
            question: "Q1",
            charLimit: 500,
            charCount: 480,
            status: "COMPLETED",
            updatedAt: "2026-05-21T10:00:00Z",
          },
          {
            id: 11,
            itemType: "ACHIEVEMENT",
            question: "Q2",
            charLimit: 600,
            charCount: 320,
            status: "DRAFT",
            updatedAt: "2026-05-20T10:00:00Z",
          },
        ],
      },
    ]);
    render(<CoverLetterListContent />);
    await waitFor(() =>
      expect(screen.getAllByText("(주)테크컴퍼니").length).toBeGreaterThan(0)
    );
    // variant status badges (text also appears in filter chip, so use getAllBy)
    expect(screen.getAllByText("제출완료").length).toBeGreaterThan(0);
    expect(screen.getAllByText("작성중").length).toBeGreaterThan(0);
    // variant cards are NOT disabled
    const variantCards = document.querySelectorAll(
      "article.cl-card:not(.master)"
    );
    variantCards.forEach((el) =>
      expect(el.getAttribute("aria-disabled")).toBeNull()
    );
  });

  test("filter strip — 전체/작성중/제출완료/휴지통 chip 렌더링", async () => {
    groupedMock.mockResolvedValue([]);
    render(<CoverLetterListContent />);
    await waitFor(() =>
      expect(screen.getByText("전체")).toBeInTheDocument()
    );
    expect(screen.getByText("작성중")).toBeInTheDocument();
    // "제출완료" appears in both the filter chip and variant badge area — at least once
    expect(screen.getAllByText("제출완료").length).toBeGreaterThan(0);
  });
});
