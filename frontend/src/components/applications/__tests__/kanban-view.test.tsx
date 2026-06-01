import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanView } from "../kanban-view";
import type { ApplicationSummary } from "@/lib/types/application";

const fetchMock = vi.fn();
const patchMock = vi.fn();
vi.mock("@/lib/api/application", () => ({
  fetchApplications: () => fetchMock(),
  patchApplication: (...a: unknown[]) => patchMock(...a),
}));

function app(over: Partial<ApplicationSummary>): ApplicationSummary {
  return {
    id: 1, postingId: 1, company: "카카오", role: "백엔드",
    currentStage: "DOC_SUBMITTED", currentResult: "IN_PROGRESS",
    variantsCount: 0, nextEvent: null, updatedAt: "2026-05-30T00:00:00Z", ...over,
  };
}

beforeEach(() => { fetchMock.mockReset(); patchMock.mockReset(); });

describe("KanbanView", () => {
  test("실데이터를 단계 컬럼에 그룹핑해 렌더", async () => {
    fetchMock.mockResolvedValue([
      app({ id: 1, company: "카카오", currentStage: "DOC_SUBMITTED" }),
      app({ id: 2, company: "네이버", currentStage: "FIRST_INTERVIEW" }),
    ]);
    render(<KanbanView />);
    await waitFor(() => expect(screen.getByText("카카오")).toBeInTheDocument());
    expect(screen.getByText("네이버")).toBeInTheDocument();
  });

  test("Result 탭으로 필터 — 합격 탭은 합격 지원만", async () => {
    fetchMock.mockResolvedValue([
      app({ id: 1, company: "카카오", currentResult: "IN_PROGRESS" }),
      app({ id: 2, company: "네이버", currentResult: "PASSED", currentStage: "PASSED" }),
    ]);
    render(<KanbanView />);
    await waitFor(() => expect(screen.getByText("카카오")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /^합격/ }));
    expect(screen.queryByText("카카오")).not.toBeInTheDocument();
    expect(screen.getByText("네이버")).toBeInTheDocument();
  });

  test("지원 0건이면 빈 상태", async () => {
    fetchMock.mockResolvedValue([]);
    render(<KanbanView />);
    await waitFor(() => expect(screen.getByText(/아직 지원이 없어요/)).toBeInTheDocument());
  });
});
