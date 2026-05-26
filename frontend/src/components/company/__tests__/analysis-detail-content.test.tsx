import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalysisDetailContent } from "../analysis-detail-content";

const fetchMock = vi.fn();
const createMock = vi.fn();

vi.mock("@/lib/api/company-analysis", () => ({
  fetchAnalysis: (...a: unknown[]) => fetchMock(...a),
  createOrReplaceAnalysis: (...a: unknown[]) => createMock(...a),
}));

const sample = {
  id: 1, company: "(주)테크컴퍼니",
  summaryJson: JSON.stringify({
    overview: { businessArea: "결제·정산 SaaS", mainProducts: ["TC-Pay"], revenue: "380억", employees: 120, location: "서울 강남구", sourceUrl: null },
    talent_profile: ["고객 중심", "데이터 기반"],
    action_points: ["포인트 A", "포인트 B"],
  }),
  sourceUrls: ["https://techcompany.kr/about"],
  generatedAt: "2026-05-21T00:00:00Z",
  generatedBy: "gpt-4o-mini",
  expiresInDays: 28,
};

beforeEach(() => { fetchMock.mockReset(); createMock.mockReset(); });

describe("AnalysisDetailContent", () => {
  test("헤더에 회사명 + 신선도 pill 렌더링", async () => {
    fetchMock.mockResolvedValue(sample);
    render(<AnalysisDetailContent id={1} />);
    await waitFor(() => expect(screen.getByText("(주)테크컴퍼니")).toBeInTheDocument());
    expect(screen.getByText(/분석 완료 · D-28/)).toBeInTheDocument();
  });

  test("회사 개요 카드: 사업 영역 + 매출 + 임직원 렌더링", async () => {
    fetchMock.mockResolvedValue(sample);
    render(<AnalysisDetailContent id={1} />);
    await waitFor(() => expect(screen.getByText(/결제·정산 SaaS/)).toBeInTheDocument());
    expect(screen.getByText(/380억/)).toBeInTheDocument();
    expect(screen.getByText(/120명/)).toBeInTheDocument();
  });

  test("인재상 카드: talent_profile 키워드 칩 렌더링", async () => {
    fetchMock.mockResolvedValue(sample);
    render(<AnalysisDetailContent id={1} />);
    await waitFor(() => expect(screen.getByText("고객 중심")).toBeInTheDocument());
    expect(screen.getByText("데이터 기반")).toBeInTheDocument();
  });

  test("활용 포인트 카드: action_points 렌더링", async () => {
    fetchMock.mockResolvedValue(sample);
    render(<AnalysisDetailContent id={1} />);
    await waitFor(() => expect(screen.getByText(/포인트 A/)).toBeInTheDocument());
    expect(screen.getByText(/포인트 B/)).toBeInTheDocument();
  });

  test("재분석 클릭 → createOrReplace API call", async () => {
    fetchMock.mockResolvedValue(sample);
    createMock.mockResolvedValue({ ...sample, generatedAt: "2026-05-22T00:00:00Z" });
    const user = userEvent.setup();
    render(<AnalysisDetailContent id={1} />);
    await screen.findByText("(주)테크컴퍼니");

    await user.click(screen.getByRole("button", { name: /다시 분석/ }));
    await waitFor(() => expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      company: "(주)테크컴퍼니",
    })));
  });
});
