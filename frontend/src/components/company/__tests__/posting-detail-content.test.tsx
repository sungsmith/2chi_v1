import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PostingDetailContent } from "../posting-detail-content";
import type { JobPosting } from "@/lib/types/posting";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const MOCK_POSTING: JobPosting = {
  id: 1,
  source: "SARAMIN",
  company: "테스트회사",
  title: "백엔드 (Saas 팀)",
  jobRole: "백엔드 · 결제·정산",
  requirements: "Java / Spring Boot 2년 이상",
  preferred: "결제 도메인 경험",
  mainTasks: "결제·정산 백엔드 서비스 개발",
  deadline: "2026-05-31",
  sourceUrl: null,
  keywords: ["Java", "Spring Boot", "PostgreSQL"],
  createdAt: "2026-05-01T00:00:00Z",
  updatedAt: "2026-05-01T00:00:00Z",
} as JobPosting;

describe("PostingDetailContent", () => {
  it("renders company + title in header", () => {
    render(<PostingDetailContent posting={MOCK_POSTING} />);
    expect(screen.getByText("테스트회사")).toBeInTheDocument();
    expect(screen.getByText("백엔드 (Saas 팀)")).toBeInTheDocument();
  });

  it("renders 자소서 쓰러 가기 CTA link", () => {
    render(<PostingDetailContent posting={MOCK_POSTING} />);
    const links = screen.getAllByRole("link", { name: /자소서 쓰러 가기/ });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("renders 편집 + 삭제 action buttons", () => {
    render(<PostingDetailContent posting={MOCK_POSTING} />);
    expect(screen.getByRole("button", { name: /편집/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /삭제/ })).toBeInTheDocument();
  });
});
