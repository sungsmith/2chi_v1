import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CareerContent } from "../career-content";
import type { Career } from "@/lib/types/career";

const authMock = {
  user: { userId: 1, email: "a@b.com", nickname: "alice", onboardingCompleted: true },
  initialized: true,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
};
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => authMock }));

const fetchCareersMock = vi.fn();
const patchProjectMock = vi.fn();
vi.mock("@/lib/api/career", () => ({
  fetchCareers: (...args: unknown[]) => fetchCareersMock(...args),
  createCareer: vi.fn(),
  updateCareer: vi.fn(),
  deleteCareer: vi.fn(),
  createProject: vi.fn(),
  patchProject: (...args: unknown[]) => patchProjectMock(...args),
  deleteProject: vi.fn(),
}));

const sampleCareer: Career = {
  id: 100,
  company: "(주)현재회사",
  position: "백엔드 개발자",
  startDate: "2024-04-01",
  endDate: null,
  isCurrent: true,
  summary: null,
  orderIndex: 0,
  projects: [{
    id: 200,
    careerHistoryId: 100,
    title: "주문 정산 시스템",
    periodStart: "2025-02-01",
    periodEnd: "2025-06-30",
    role: null,
    techStack: [],
    structureType: "PRAR",
    prar: { problem: null, rootCause: null, approach: null, result: null },
    metrics: [],
    orderIndex: 0,
  }],
};

beforeEach(() => {
  fetchCareersMock.mockReset();
  patchProjectMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CareerContent", () => {
  test("로딩 중 — '불러오는 중' 표시", () => {
    fetchCareersMock.mockReturnValue(new Promise(() => {}));
    render(<CareerContent />);
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument();
  });

  test("빈 목록 → '아직 등록된 회사가 없어요' 안내", async () => {
    fetchCareersMock.mockResolvedValue([]);
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText(/아직 등록된 회사가 없어요/)).toBeInTheDocument());
  });

  test("회사 1개 + 프로젝트 1개 — 회사명·프로젝트 타이틀 노출", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText("(주)현재회사")).toBeInTheDocument());
    expect(screen.getByText("주문 정산 시스템")).toBeInTheDocument();
  });

  test("AssistantNote — metrics 비어있는 프로젝트 안내", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText(/정량 성과가 비어있어요/)).toBeInTheDocument());
  });

  test("PRAR 입력 후 blur → autosave (patchProject 호출)", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    patchProjectMock.mockResolvedValue({
      ...sampleCareer.projects[0],
      prar: { problem: "월말 정산 TPS 한계", rootCause: null, approach: null, result: null },
    });

    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText("주문 정산 시스템")).toBeInTheDocument());

    // 첫 번째 프로젝트는 defaultOpen=true 라 이미 열림
    const problemTextarea = screen.getByPlaceholderText(/문제 상황을 적어주세요/);
    await user.type(problemTextarea, "월말 정산 TPS 한계");
    await user.tab(); // blur 트리거

    await waitFor(() => {
      expect(patchProjectMock).toHaveBeenCalledWith(100, 200, { prar: { problem: "월말 정산 TPS 한계" } });
    });
  });
});
