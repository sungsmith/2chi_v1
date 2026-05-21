import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AnalysisListContent } from "../analysis-list-content";

const mock = vi.fn();
vi.mock("@/lib/api/company-analysis", () => ({
  fetchAnalyses: (...a: unknown[]) => mock(...a),
}));

beforeEach(() => { mock.mockReset(); });

describe("AnalysisListContent", () => {
  test("빈 상태 표시", async () => {
    mock.mockResolvedValue([]);
    render(<AnalysisListContent />);
    await waitFor(() => expect(screen.getByText(/아직 분석한 기업이 없어요/)).toBeInTheDocument());
  });

  test("카드 + D-N 표시", async () => {
    mock.mockResolvedValue([
      { id: 1, company: "(주)테크컴퍼니", generatedAt: "2026-05-21T00:00:00Z", expiresInDays: 28 },
      { id: 2, company: "(주)지난회사", generatedAt: "2026-04-01T00:00:00Z", expiresInDays: -5 },
    ]);
    render(<AnalysisListContent />);
    expect(await screen.findByText("(주)테크컴퍼니")).toBeInTheDocument();
    expect(screen.getByText(/D-28/)).toBeInTheDocument();
    expect(screen.getByText(/만료됨/)).toBeInTheDocument();
  });
});
