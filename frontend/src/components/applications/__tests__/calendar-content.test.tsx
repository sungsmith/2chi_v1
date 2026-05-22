import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CalendarContent } from "../calendar-content";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/applications/calendar",
}));

vi.mock("@/lib/api/application", () => ({
  fetchEvents: vi.fn(),
  fetchApplications: vi.fn(),
  patchEvent: vi.fn(),
  deleteEvent: vi.fn(),
  createEvent: vi.fn(),
}));

import { fetchEvents, fetchApplications } from "@/lib/api/application";

const EV = {
  id: 100, type: "FIRST_INTERVIEW", eventDate: "2026-05-15",
  eventTime: "14:00:00", memo: null, applicationId: 1,
  company: "(주)테크", role: "백엔드",
};

describe("CalendarContent", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    vi.mocked(fetchEvents).mockResolvedValue([EV as never]);
    vi.mocked(fetchApplications).mockResolvedValue([{
      id: 1, postingId: 10, company: "(주)테크", role: "백엔드",
      currentStage: "FIRST_INTERVIEW", currentResult: "IN_PROGRESS",
      variantsCount: 0, nextEvent: null, updatedAt: "",
    } as never]);
  });

  it("진입 시 fetchEvents + fetchApplications 병렬 호출", async () => {
    render(<CalendarContent month="2026-05" />);
    await waitFor(() => {
      expect(fetchEvents).toHaveBeenCalled();
      expect(fetchApplications).toHaveBeenCalled();
    });
  });

  it("이전 달 버튼 클릭 시 router.replace 호출", async () => {
    render(<CalendarContent month="2026-05" />);
    fireEvent.click(screen.getByLabelText("이전 달"));
    expect(replaceMock).toHaveBeenCalledWith("/applications/calendar?month=2026-04");
  });

  it("event chip 클릭 시 EventEditModal open", async () => {
    render(<CalendarContent month="2026-05" />);
    const chip = await screen.findByLabelText(/1차 면접 \(주\)테크/);
    fireEvent.click(chip);
    expect(await screen.findByText("일정 편집")).toBeInTheDocument();
  });

  it("+ 일정 추가 클릭 시 EventCreateModal open", async () => {
    render(<CalendarContent month="2026-05" />);
    await screen.findByLabelText(/1차 면접/);
    fireEvent.click(screen.getByText("+ 일정 추가"));
    expect(await screen.findByText("+ 일정 추가", { selector: "h3" })).toBeInTheDocument();
  });
});
