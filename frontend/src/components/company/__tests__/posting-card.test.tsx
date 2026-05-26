import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PostingCard } from "../posting-card";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/api/company-analysis", () => ({
  fetchAnalysisByCompany: vi.fn(),
}));

vi.mock("@/lib/api/application", () => ({
  createApplication: vi.fn(),
}));

const POSTING = {
  id: 10, company: "(주)테크", title: "백엔드 (2~5년)", jobRole: "백엔드",
  source: "MANUAL",
  deadline: "2026-06-30", sourceUrl: null, keywords: [], createdAt: "2026-05-20T00:00:00Z", updatedAt: "",
};

describe("PostingCard", () => {
  it("공고 제목과 회사명 표시", () => {
    render(<PostingCard
      posting={POSTING as never}
      applicationId={null}
      onEdit={vi.fn()} onDelete={vi.fn()}
      onApplied={vi.fn()}
    />);
    expect(screen.getByText("백엔드 (2~5년)")).toBeInTheDocument();
    expect(screen.getByText("(주)테크")).toBeInTheDocument();
  });

  it("출처 배지 표시 (MANUAL → 직접 작성)", () => {
    render(<PostingCard
      posting={POSTING as never}
      applicationId={null}
      onEdit={vi.fn()} onDelete={vi.fn()}
      onApplied={vi.fn()}
    />);
    expect(screen.getByText("직접 작성")).toBeInTheDocument();
  });

  it("더보기 버튼 클릭 시 onEdit 호출", () => {
    const onEdit = vi.fn();
    render(<PostingCard
      posting={POSTING as never}
      applicationId={null}
      onEdit={onEdit} onDelete={vi.fn()}
      onApplied={vi.fn()}
    />);
    fireEvent.click(screen.getByRole("button", { name: "더보기" }));
    expect(onEdit).toHaveBeenCalled();
  });

  it("카드가 /company/postings/10 링크를 가짐", () => {
    render(<PostingCard
      posting={POSTING as never}
      applicationId={null}
      onEdit={vi.fn()} onDelete={vi.fn()}
      onApplied={vi.fn()}
    />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/company/postings/10");
  });

  it("마감된 공고 카드에 closed 클래스 적용", () => {
    const closedPosting = { ...POSTING, deadline: "2020-01-01" };
    const { container } = render(<PostingCard
      posting={closedPosting as never}
      applicationId={null}
      onEdit={vi.fn()} onDelete={vi.fn()}
      onApplied={vi.fn()}
    />);
    expect(container.querySelector(".posting-row.closed")).toBeInTheDocument();
  });

  it("D-day 필이 마감 공고는 '마감' 표시", () => {
    const closedPosting = { ...POSTING, deadline: "2020-01-01" };
    render(<PostingCard
      posting={closedPosting as never}
      applicationId={null}
      onEdit={vi.fn()} onDelete={vi.fn()}
      onApplied={vi.fn()}
    />);
    expect(screen.getByText("마감")).toBeInTheDocument();
  });
});
