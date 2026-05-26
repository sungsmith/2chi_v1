import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostingsContent } from "../postings-content";
import type { JobPosting } from "@/lib/types/posting";

const fetchMock = vi.fn();
const patchMock = vi.fn();
const deleteMock = vi.fn();
vi.mock("@/lib/api/posting", () => ({
  fetchPostings: (...a: unknown[]) => fetchMock(...a),
  patchPosting: (...a: unknown[]) => patchMock(...a),
  deletePosting: (...a: unknown[]) => deleteMock(...a),
}));
vi.mock("@/lib/api/application", () => ({
  fetchApplications: vi.fn().mockResolvedValue([]),
  createApplication: vi.fn(),
}));
vi.mock("@/lib/api/company-analysis", () => ({
  fetchAnalysisByCompany: vi.fn().mockResolvedValue({ id: null, company: "" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/company/postings",
}));

const samplePosting: JobPosting = {
  id: 1, source: "MANUAL",
  company: "(주)테크", title: "백엔드 개발자",
  jobRole: "백엔드", requirements: null, preferred: null, mainTasks: null,
  deadline: "2026-06-30", sourceUrl: null,
  keywords: ["Spring", "MSA"],
  createdAt: "2026-05-21T00:00:00Z", updatedAt: "2026-05-21T00:00:00Z",
};

beforeEach(() => {
  fetchMock.mockReset();
  patchMock.mockReset();
  deleteMock.mockReset();
});

describe("PostingsContent", () => {
  test("빈 목록 안내", async () => {
    fetchMock.mockResolvedValue([]);
    render(<PostingsContent />);
    expect(await screen.findByText(/아직 등록한 공고가 없어요/)).toBeInTheDocument();
  });

  test("기존 리스트 표시 — 공고 제목 + 회사명", async () => {
    fetchMock.mockResolvedValue([samplePosting]);
    render(<PostingsContent />);
    expect(await screen.findByText("백엔드 개발자")).toBeInTheDocument();
    expect(screen.getByText("(주)테크")).toBeInTheDocument();
  });

  test("헤더에 + 공고 등록 링크 표시", async () => {
    fetchMock.mockResolvedValue([]);
    render(<PostingsContent />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const link = screen.getByRole("link", { name: /공고 등록/ });
    expect(link).toHaveAttribute("href", "/company/postings/new");
  });

  test("카드 더보기 클릭 → 편집 모달 열림", async () => {
    fetchMock.mockResolvedValue([samplePosting]);
    patchMock.mockResolvedValue({ ...samplePosting, title: "백엔드 개발자 (수정됨)" });
    const user = userEvent.setup();
    render(<PostingsContent />);
    await screen.findByText("백엔드 개발자");

    await user.click(screen.getByRole("button", { name: /더보기/ }));
    const titleInput = await screen.findByLabelText(/공고 제목/);
    await user.clear(titleInput);
    await user.type(titleInput, "백엔드 개발자 (수정됨)");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith(1, expect.objectContaining({ title: "백엔드 개발자 (수정됨)" }));
    });
    expect(await screen.findByText("백엔드 개발자 (수정됨)")).toBeInTheDocument();
  });

  test("필터 칩 — 전체/진행중/마감 버튼 표시", async () => {
    fetchMock.mockResolvedValue([]);
    render(<PostingsContent />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /전체/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /진행중/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /마감/ })).toBeInTheDocument();
  });

  // TODO Task 9: create flow (URL 파싱 / 직접 작성) 은 /company/postings/new 라우트로 이동 — 해당 페이지 테스트에서 커버
  test.skip("직접 작성 → 저장 → 리스트 prepend", () => {});
  test.skip("URL 파싱 실패 시 manual 탭 자동 전환 + 배너", () => {});
  // TODO Task 9: keyword chip 은 PostingCard 에서 제거됨 — posting-detail 에서 커버
  test.skip("기존 리스트 표시 + keyword chip", () => {});
});
