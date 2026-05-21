import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostingsContent } from "../postings-content";
import type { JobPosting } from "@/lib/types/posting";

const fetchMock = vi.fn();
const createMock = vi.fn();
const patchMock = vi.fn();
const deleteMock = vi.fn();
const parseMock = vi.fn();
vi.mock("@/lib/api/posting", () => ({
  fetchPostings: (...a: unknown[]) => fetchMock(...a),
  createPosting: (...a: unknown[]) => createMock(...a),
  patchPosting: (...a: unknown[]) => patchMock(...a),
  deletePosting: (...a: unknown[]) => deleteMock(...a),
  parsePosting: (...a: unknown[]) => parseMock(...a),
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
  createMock.mockReset();
  patchMock.mockReset();
  deleteMock.mockReset();
  parseMock.mockReset();
});

describe("PostingsContent", () => {
  test("빈 목록 안내", async () => {
    fetchMock.mockResolvedValue([]);
    render(<PostingsContent />);
    expect(await screen.findByText(/아직 등록한 공고가 없어요/)).toBeInTheDocument();
  });

  test("기존 리스트 표시 + keyword chip", async () => {
    fetchMock.mockResolvedValue([samplePosting]);
    render(<PostingsContent />);
    expect(await screen.findByText("백엔드 개발자")).toBeInTheDocument();
    expect(screen.getByText("Spring")).toBeInTheDocument();
    expect(screen.getByText("MSA")).toBeInTheDocument();
  });

  test("직접 작성 → 저장 → 리스트 prepend", async () => {
    fetchMock.mockResolvedValue([]);
    createMock.mockResolvedValue(samplePosting);
    const user = userEvent.setup();
    render(<PostingsContent />);
    await waitFor(() => expect(screen.getByText(/아직 등록한 공고가 없어요/)).toBeInTheDocument());

    await user.click(screen.getByRole("tab", { name: /직접 작성/ }));
    await user.type(screen.getByLabelText(/회사명/), "(주)테크");
    await user.type(screen.getByLabelText(/공고 제목/), "백엔드 개발자");
    await user.click(screen.getByRole("button", { name: /저장 후 자소서 작성/ }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
        source: "MANUAL", company: "(주)테크", title: "백엔드 개발자",
      }));
    });
    expect(await screen.findByText("백엔드 개발자")).toBeInTheDocument();
  });

  test("URL 파싱 실패 시 manual 탭 자동 전환 + 배너", async () => {
    fetchMock.mockResolvedValue([]);
    parseMock.mockRejectedValue(new Error("자동 파싱이 안 되는 사이트예요. 직접 작성으로 입력해주세요."));
    const user = userEvent.setup();
    render(<PostingsContent />);
    await waitFor(() => expect(screen.getByText(/아직 등록한 공고가 없어요/)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/채용공고 URL/), "https://example.com/job/1");
    await user.click(screen.getByRole("button", { name: /^파싱$/ }));

    expect(await screen.findByText(/자동 파싱이 안 되는 사이트/)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /직접 작성/, selected: true })).toBeInTheDocument();
  });

  test("카드 편집 → 모달 → 저장 → 리스트 갱신", async () => {
    fetchMock.mockResolvedValue([samplePosting]);
    patchMock.mockResolvedValue({ ...samplePosting, title: "백엔드 개발자 (수정됨)" });
    const user = userEvent.setup();
    render(<PostingsContent />);
    await screen.findByText("백엔드 개발자");

    await user.click(screen.getAllByRole("button", { name: /^편집$/ })[0]);
    const titleInput = await screen.findByLabelText(/공고 제목/);
    await user.clear(titleInput);
    await user.type(titleInput, "백엔드 개발자 (수정됨)");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith(1, expect.objectContaining({ title: "백엔드 개발자 (수정됨)" }));
    });
    expect(await screen.findByText("백엔드 개발자 (수정됨)")).toBeInTheDocument();
  });
});
