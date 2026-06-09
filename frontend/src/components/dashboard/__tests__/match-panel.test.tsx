import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchPanel } from "../match-panel";

const fetchMock = vi.fn();
vi.mock("@/lib/api/match", () => ({ fetchDashboardMatch: (...a: unknown[]) => fetchMock(...a) }));

beforeEach(() => fetchMock.mockReset());

describe("MatchPanel", () => {
  it("공고 0건 → 등록 유도 안내", async () => {
    fetchMock.mockResolvedValue({ percent: 0, postingCount: 0, gaps: [] });
    render(<MatchPanel />);
    expect(await screen.findByText(/아직 비교할 채용공고가 없어요/)).toBeInTheDocument();
    expect(screen.queryByText("매칭률")).not.toBeInTheDocument();
  });

  it("데이터 → 링 percent + 부족 역량 gaps 렌더", async () => {
    fetchMock.mockResolvedValue({
      percent: 50, postingCount: 2,
      gaps: [{ keyword: "Kafka", hitCount: 2 }, { keyword: "MSA", hitCount: 1 }],
    });
    render(<MatchPanel />);
    expect(await screen.findByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Kafka")).toBeInTheDocument();
    expect(screen.getByText("MSA")).toBeInTheDocument();
    expect(screen.getByText(/채용공고 2건을 기준/)).toBeInTheDocument();
  });

  it("에러 → 안내(placeholder)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("x"));
    render(<MatchPanel />);
    expect(await screen.findByText(/아직 비교할 채용공고가 없어요/)).toBeInTheDocument();
  });
});
