import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DashboardContent } from "../dashboard-content";
import type { ApplicationSummary } from "@/lib/types/application";
import type { VariantListGroup } from "@/lib/types/cover-letter";

// ── API 모킹 (대시보드가 집계 소스로 호출하는 5개 엔드포인트) ──
const profileMock = vi.fn();
const educationsMock = vi.fn();
const careersMock = vi.fn();
const variantsMock = vi.fn();
const applicationsMock = vi.fn();

vi.mock("@/lib/api/profile", () => ({ fetchProfile: () => profileMock() }));
vi.mock("@/lib/api/education", () => ({ fetchEducations: () => educationsMock() }));
vi.mock("@/lib/api/career", () => ({ fetchCareers: () => careersMock() }));
vi.mock("@/lib/api/cover-letter", () => ({ fetchVariantsGrouped: () => variantsMock() }));
vi.mock("@/lib/api/application", () => ({
  fetchEvents: vi.fn().mockResolvedValue([]),
  fetchApplications: () => applicationsMock(),
}));

type AuthUser = { userId: number; email: string; nickname: string; onboardingCompleted: boolean };
type AuthMock = {
  user: AuthUser | null;
  initialized: boolean;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  refreshUser: ReturnType<typeof vi.fn>;
};

let authMock: AuthMock = {
  user: { userId: 1, email: "kim@example.com", nickname: "김소미", onboardingCompleted: true },
  initialized: true,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
};

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => authMock,
}));

// HomeBanner 안의 next/link 처리
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const baseProfile = {
  name: "김소미", birthDate: "1998-01-01", phone: "010-1111-2222",
  region: null, introduction: null, // 5개 중 3개 → 60%
  target: null, careerYear: null, targetJobs: [], onboardingCompleted: true,
};

const variantGroups: VariantListGroup[] = [
  {
    posting: { id: 1, company: "네이버", title: "백엔드" },
    variants: [
      { id: 1, itemType: "MOTIVATION", question: "Q", charLimit: 500, charCount: 100, status: "DRAFT", updatedAt: "2026-05-05T00:00:00Z" },
      { id: 2, itemType: "ACHIEVEMENT", question: "Q", charLimit: 500, charCount: 100, status: "COMPLETED", updatedAt: "2026-05-06T00:00:00Z" },
    ],
  },
];

const apps: ApplicationSummary[] = [
  { id: 1, postingId: 1, company: "네이버", role: "백엔드", currentStage: "DOC_SUBMITTED", currentResult: "IN_PROGRESS", variantsCount: 1, nextEvent: null, updatedAt: "2026-05-01T00:00:00Z" },
  { id: 2, postingId: 2, company: "카카오", role: "백엔드", currentStage: "FIRST_INTERVIEW", currentResult: "IN_PROGRESS", variantsCount: 1, nextEvent: null, updatedAt: "2026-05-02T00:00:00Z" },
  { id: 3, postingId: 3, company: "토스", role: "백엔드", currentStage: "PASSED", currentResult: "PASSED", variantsCount: 1, nextEvent: null, updatedAt: "2026-05-03T00:00:00Z" },
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 4, 20, 10, 0, 0));
  authMock = {
    user: { userId: 1, email: "kim@example.com", nickname: "김소미", onboardingCompleted: true },
    initialized: true,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };
  profileMock.mockResolvedValue({ ...baseProfile });
  educationsMock.mockResolvedValue([{ id: 1 }]);
  careersMock.mockResolvedValue([{ id: 1 }]);
  variantsMock.mockResolvedValue(variantGroups);
  applicationsMock.mockResolvedValue(apps);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DashboardContent", () => {
  test("온보딩 완료자: 닉네임 + 부제 태그 3개 + HomeBanner 미표시", () => {
    render(<DashboardContent />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/김소미님/);
    expect(screen.getByText("백엔드")).toBeInTheDocument();
    expect(screen.getByText("중고신입 (2년차)")).toBeInTheDocument();
    expect(screen.getByText("이직 준비 중")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("온보딩 미완료자: 닉네임 표시 + 부제 태그 숨김 + HomeBanner 표시", () => {
    authMock.user = { userId: 1, email: "kim@example.com", nickname: "김소미", onboardingCompleted: false };
    render(<DashboardContent />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/김소미님/);
    expect(screen.queryByText("백엔드")).not.toBeInTheDocument();
    expect(screen.queryByText("이직 준비 중")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("3-card KPI 렌더 — 실데이터 집계 (완성도 87 / 자소서 2 / 진행중 2)", async () => {
    vi.useRealTimers(); // findBy 폴링용 (집계값은 날짜 비의존)
    render(<DashboardContent />);

    const completenessCard = (await screen.findByText("내 작성 이력 완성도")).closest("article");
    // (60 + 100 + 100) / 3 = 86.67 → 87
    expect(within(completenessCard!).getByText("87", { selector: ".num" })).toBeInTheDocument();

    const coverLettersCard = screen.getByText("자소서 작성 수").closest("article");
    expect(within(coverLettersCard!).getByText("2", { selector: ".num" })).toBeInTheDocument();

    const inProgressCard = screen.getByText("진행 중인 지원").closest("article");
    expect(within(inProgressCard!).getByText("2", { selector: ".num" })).toBeInTheDocument();
  });

  test("매칭 분석 — 가짜 매칭률 대신 'v2 준비 중' 플레이스홀더", () => {
    render(<DashboardContent />);
    expect(screen.getByText("매칭 분석을 준비하고 있어요")).toBeInTheDocument();
    expect(screen.getByText("v2 준비 중")).toBeInTheDocument();
    expect(screen.queryByText("매칭률")).not.toBeInTheDocument();
  });

  test("UpcomingPanel — 빈 응답 시 안내 메시지 노출", async () => {
    vi.useRealTimers();
    render(<DashboardContent />);
    expect(await screen.findByText(/다가오는 일정이 없어요/)).toBeInTheDocument();
  });

  test("Shortcuts 4개 — 모두 활성화 + 실제 라우트 매칭", () => {
    render(<DashboardContent />);
    const coverLetter = screen.getByText("자소서 작성").closest("a");
    expect(coverLetter).toHaveAttribute("href", "/cover-letters");
    const jobs = screen.getByText("채용공고 등록").closest("a");
    expect(jobs).toHaveAttribute("href", "/company/postings");
    const company = screen.getByText("기업분석 시작").closest("a");
    expect(company).toHaveAttribute("href", "/company/analysis");
    const calendarLinks = screen
      .getAllByText("캘린더 보기")
      .map((el) => el.closest("a"))
      .filter((a): a is HTMLAnchorElement => !!a && a.getAttribute("href") === "/applications/calendar");
    expect(calendarLinks.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("준비중")).toBeNull();
  });
});
