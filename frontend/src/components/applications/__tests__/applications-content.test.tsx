import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApplicationsContent } from "../applications-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/applications",
}));

vi.mock("@/lib/api/application", () => ({
  fetchApplications: vi.fn(),
  fetchApplication: vi.fn(),
  patchApplication: vi.fn(),
  deleteApplication: vi.fn(),
  createEvent: vi.fn(),
  patchEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

import { fetchApplications, fetchApplication } from "@/lib/api/application";

const SUMMARIES = [
  {
    id: 1, postingId: 10, company: "(주)테크", role: "백엔드",
    currentStage: "FIRST_INTERVIEW", currentResult: "IN_PROGRESS",
    variantsCount: 2, nextEvent: { id: 100, type: "FIRST_INTERVIEW", eventDate: "2026-06-10", eventTime: "14:00:00", memo: null, applicationId: 1 } as never,
    updatedAt: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    id: 2, postingId: 11, company: "(주)스타트", role: "프론트엔드",
    currentStage: "DOC_SUBMITTED", currentResult: "IN_PROGRESS",
    variantsCount: 0, nextEvent: null,
    updatedAt: new Date(Date.now() - 60_000).toISOString(),
  },
];

describe("ApplicationsContent", () => {
  beforeEach(() => {
    vi.mocked(fetchApplications).mockResolvedValue(SUMMARIES as never);
  });

  it("진입 시 fetchApplications 호출 + 행 렌더", async () => {
    render(<ApplicationsContent />);
    await waitFor(() => expect(fetchApplications).toHaveBeenCalled());
    expect(await screen.findByText("(주)테크")).toBeInTheDocument();
    expect(screen.getByText("(주)스타트")).toBeInTheDocument();
  });

  it("전형 chip 클릭 시 router.replace 호출", async () => {
    const replace = vi.fn();
    const nav = await import("next/navigation");
    vi.spyOn(nav, "useRouter").mockReturnValue({ replace } as never);
    render(<ApplicationsContent />);
    await screen.findByText("(주)테크");
    fireEvent.click(screen.getAllByText(/^1차 면접/)[0]);
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("stage=FIRST_INTERVIEW"));
  });

  it("행 클릭 시 ApplicationEditModal open + fetchApplication 호출", async () => {
    vi.mocked(fetchApplication).mockResolvedValue({
      id: 1, postingId: 10, company: "(주)테크", role: "백엔드",
      currentStage: "FIRST_INTERVIEW", currentResult: "IN_PROGRESS",
      memo: null, variantsCount: 2, events: [],
      createdAt: "", updatedAt: "",
    });
    render(<ApplicationsContent />);
    fireEvent.click(await screen.findByText("(주)테크"));
    await waitFor(() => expect(fetchApplication).toHaveBeenCalledWith(1));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("빈 응답 시 EmptyState 렌더", async () => {
    vi.mocked(fetchApplications).mockResolvedValueOnce([]);
    render(<ApplicationsContent />);
    expect(await screen.findByText(/아직 지원한 공고가 없어요/)).toBeInTheDocument();
  });
});
