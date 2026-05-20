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
const createCareerMock = vi.fn();
const createProjectMock = vi.fn();
vi.mock("@/lib/api/career", () => ({
  fetchCareers: (...args: unknown[]) => fetchCareersMock(...args),
  createCareer: (...args: unknown[]) => createCareerMock(...args),
  updateCareer: vi.fn(),
  deleteCareer: vi.fn(),
  createProject: (...args: unknown[]) => createProjectMock(...args),
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
  createCareerMock.mockReset();
  createProjectMock.mockReset();
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

  test("회사 추가 — 빈 값 시 검증 에러, createCareer 호출 없음", async () => {
    fetchCareersMock.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText(/회사 추가/)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /회사 추가/ }));
    // 폼 노출 확인
    const companyInput = await screen.findByLabelText(/회사명/);
    expect(companyInput).toBeInTheDocument();

    // 빈 값으로 저장 시도
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    expect(await screen.findByText(/회사명을 입력해주세요/)).toBeInTheDocument();
    expect(createCareerMock).not.toHaveBeenCalled();
  });

  test("회사 추가 — 마스킹 적용 + 저장 성공 + 리스트 refetch", async () => {
    fetchCareersMock.mockResolvedValue([]);
    createCareerMock.mockResolvedValue({
      id: 999, company: "(주)신규", position: null,
      startDate: "2024-01-01", endDate: null, isCurrent: true,
      summary: null, orderIndex: 0, projects: [],
    });
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText(/회사 추가/)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /회사 추가/ }));
    await user.type(await screen.findByLabelText(/회사명/), "(주)신규");

    const startInput = screen.getByLabelText(/시작일/);
    await user.type(startInput, "20240101");
    expect(startInput).toHaveValue("2024-01-01");

    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(createCareerMock).toHaveBeenCalledWith({
        company: "(주)신규",
        position: undefined,
        startDate: "2024-01-01",
        endDate: null,
      });
    });

    // 폼 사라짐
    await waitFor(() => expect(screen.queryByLabelText(/회사명/)).not.toBeInTheDocument());
  });

  test("프로젝트 추가 — 저장 성공 → createProject 호출", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    createProjectMock.mockResolvedValue({
      id: 300, careerHistoryId: 100, title: "신규 프로젝트",
      periodStart: null, periodEnd: null, role: null,
      techStack: [], structureType: "PRAR",
      prar: { problem: null, rootCause: null, approach: null, result: null },
      metrics: [], orderIndex: 1,
    });
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText("(주)현재회사")).toBeInTheDocument());

    // 회사 카드의 "프로젝트 추가" 버튼 (이미 defaultOpen=true)
    await user.click(screen.getByRole("button", { name: /프로젝트 추가/ }));
    await user.type(await screen.findByLabelText(/프로젝트 이름/), "신규 프로젝트");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith(100, {
        title: "신규 프로젝트",
        periodStart: null,
        periodEnd: null,
        role: null,
      });
    });
  });

  test("메트릭 추가 — compare 저장 → patchProject 호출", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    patchProjectMock.mockResolvedValue({
      ...sampleCareer.projects[0],
      metrics: [{ k: "TPS", before: "500", after: "2000" }],
    });
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText("주문 정산 시스템")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /성과 지표 추가/ }));

    await user.type(await screen.findByLabelText(/지표/), "TPS");
    await user.type(screen.getByLabelText(/^전/), "500");
    await user.type(screen.getByLabelText(/^후/), "2000");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(patchProjectMock).toHaveBeenCalledWith(100, 200, {
        metrics: [{ k: "TPS", before: "500", after: "2000" }],
      });
    });
  });

  test("메트릭 추가 — delta 토글 + 저장 → patchProject 호출 (dir 기본 up)", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    patchProjectMock.mockResolvedValue({
      ...sampleCareer.projects[0],
      metrics: [{ k: "매출", delta: "₩2,000,000", dir: "up" }],
    });
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText("주문 정산 시스템")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /성과 지표 추가/ }));

    // delta 라디오 토글
    await user.click(await screen.findByLabelText(/증감 \(Δ\)/));
    // before/after 사라지고 delta/방향 노출
    expect(screen.queryByLabelText(/^전/)).not.toBeInTheDocument();

    // "증감" 은 라디오와 필드 둘 다 매치되므로 textbox role 로 명시
    await user.type(screen.getByRole("textbox", { name: /지표/ }), "매출");
    await user.type(screen.getByRole("textbox", { name: /^증감/ }), "₩2,000,000");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    await waitFor(() => {
      expect(patchProjectMock).toHaveBeenCalledWith(100, 200, {
        metrics: [{ k: "매출", delta: "₩2,000,000", dir: "up" }],
      });
    });
  });

  test("회사 추가 — endDate < startDate 검증 에러, createCareer 호출 없음", async () => {
    fetchCareersMock.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText(/회사 추가/)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /회사 추가/ }));
    await user.type(await screen.findByLabelText(/회사명/), "(주)예시");
    await user.type(screen.getByLabelText(/시작일/), "20240301");
    await user.type(screen.getByLabelText(/종료일/), "20240101");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    expect(await screen.findByText(/종료일은 시작일과 같거나 이후여야 해요/)).toBeInTheDocument();
    expect(createCareerMock).not.toHaveBeenCalled();
  });

  test("프로젝트 추가 — periodEnd < periodStart 검증 에러, createProject 호출 없음", async () => {
    fetchCareersMock.mockResolvedValue([sampleCareer]);
    const user = userEvent.setup();
    render(<CareerContent />);
    await waitFor(() => expect(screen.getByText("(주)현재회사")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /프로젝트 추가/ }));
    await user.type(await screen.findByLabelText(/프로젝트 이름/), "테스트");
    await user.type(screen.getByLabelText(/시작일/), "20240601");
    await user.type(screen.getByLabelText(/종료일/), "20240501");
    await user.click(screen.getByRole("button", { name: /^저장$/ }));

    expect(await screen.findByText(/종료일은 시작일과 같거나 이후여야 해요/)).toBeInTheDocument();
    expect(createProjectMock).not.toHaveBeenCalled();
  });
});
