import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MatchPanel } from "../match-panel";
import { MATCH_RING_MOCK, GAPS_MOCK } from "@/lib/mock/dashboard";

describe("MatchPanel", () => {
  it("renders match ring percentage", () => {
    render(<MatchPanel ring={MATCH_RING_MOCK} gaps={GAPS_MOCK} />);
    expect(screen.getByText("68%")).toBeInTheDocument();
    expect(screen.getByText("매칭률")).toBeInTheDocument();
  });

  it("renders ring meta — position + label + description", () => {
    render(<MatchPanel ring={MATCH_RING_MOCK} gaps={GAPS_MOCK} />);
    expect(screen.getByText("희망 포지션 · 백엔드")).toBeInTheDocument();
    expect(screen.getByText("JD 평균 매칭률")).toBeInTheDocument();
    expect(screen.getByText(/최근 등록한 채용공고 8건/)).toBeInTheDocument();
  });

  it("renders all 3 gaps with name + sub + hit", () => {
    render(<MatchPanel ring={MATCH_RING_MOCK} gaps={GAPS_MOCK} />);
    expect(screen.getByText("Kafka / MSA 운영 경험")).toBeInTheDocument();
    expect(screen.getByText("결제·정산 도메인 공고에서 자주 언급")).toBeInTheDocument();
    expect(screen.getByText("+5건")).toBeInTheDocument();
    expect(screen.getByText("+4건")).toBeInTheDocument();
    expect(screen.getByText("+3건")).toBeInTheDocument();
  });
});
