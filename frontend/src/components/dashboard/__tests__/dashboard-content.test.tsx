import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { DashboardContent } from "../dashboard-content";

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
});

describe("DashboardContent", () => {
  test("온보딩 완료자: 닉네임 + 부제 태그 3개 + HomeBanner 미표시", () => {
    render(<DashboardContent />);
    // 닉네임
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/김소미님/);
    // 부제 태그 3개
    expect(screen.getByText("백엔드")).toBeInTheDocument();
    expect(screen.getByText("중고신입 (2년차)")).toBeInTheDocument();
    expect(screen.getByText("이직 준비 중")).toBeInTheDocument();
    // HomeBanner (role="status") 미존재
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

  test("3-card KPI 렌더 — 완성도 72 / 자소서 14 / 진행중 7", () => {
    render(<DashboardContent />);
    // 각 카드 article 로 scope 좁혀서 num 검증 (다른 위젯과 동일 숫자 충돌 회피)
    const completenessCard = screen.getByText("내 작성 이력 완성도").closest("article");
    expect(completenessCard).not.toBeNull();
    // .kpi-value > span.num 만 선택 (bar pct 값과 충돌 회피)
    expect(within(completenessCard!).getByText("72", { selector: ".num" })).toBeInTheDocument();

    const coverLettersCard = screen.getByText("자소서 작성 수").closest("article");
    expect(coverLettersCard).not.toBeNull();
    // .kpi-value > span.num 만 선택 (mini-stats span.v 안의 14와 충돌 회피)
    expect(within(coverLettersCard!).getByText("14", { selector: ".num" })).toBeInTheDocument();

    const inProgressCard = screen.getByText("진행 중인 지원").closest("article");
    expect(inProgressCard).not.toBeNull();
    expect(within(inProgressCard!).getByText("7", { selector: ".num" })).toBeInTheDocument();
  });

  test("UpcomingPanel — Mock 일정 4건 회사명·시간 노출", () => {
    render(<DashboardContent />);
    expect(screen.getByText("(주)테크컴퍼니")).toBeInTheDocument();
    expect(screen.getByText("네이버")).toBeInTheDocument();
    expect(screen.getByText("카카오")).toBeInTheDocument();
    expect(screen.getByText("토스")).toBeInTheDocument();
    expect(screen.getByText("14:00")).toBeInTheDocument();
    expect(screen.getByText("23:59")).toBeInTheDocument();
  });

  test("Shortcuts 4개 — 앞 2개 작동, 뒤 2개 aria-disabled", () => {
    render(<DashboardContent />);
    // 작동 — 자소서 작성 / 채용공고 등록
    const coverLetter = screen.getByText("자소서 작성").closest("a");
    expect(coverLetter).toHaveAttribute("href", "/cover-letter");
    const jobs = screen.getByText("채용공고 등록").closest("a");
    expect(jobs).toHaveAttribute("href", "/jobs");
    // disabled — 기업분석 / 캘린더
    // "캘린더 보기"는 UpcomingPanel에도 존재하므로 role="link" 요소 중에서 찾기
    const company = screen.getByText("기업분석 시작").closest('[role="link"]');
    expect(company).toHaveAttribute("aria-disabled", "true");
    const calendarLinks = screen
      .getAllByText("캘린더 보기")
      .map((el) => el.closest('[role="link"]'))
      .filter(Boolean);
    expect(calendarLinks.length).toBeGreaterThanOrEqual(1);
    expect(calendarLinks[0]).toHaveAttribute("aria-disabled", "true");
    // "준비중" 배지 2개
    expect(screen.getAllByText("준비중")).toHaveLength(2);
  });
});
