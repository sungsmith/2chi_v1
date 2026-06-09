import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HistoryView } from "../history-view";

const fetchMock = vi.fn();
vi.mock("@/lib/api/activity", () => ({ fetchActivities: (...a: unknown[]) => fetchMock(...a) }));

const emptyCounts = { STAGE: 0, COVER_LETTER: 0, NOTIFICATION: 0, APPLICATION: 0 };

beforeEach(() => fetchMock.mockReset());

describe("HistoryView", () => {
  it("빈 응답 — 안내 메시지", async () => {
    fetchMock.mockResolvedValue({ activities: [], totalCount: 0, page: 0, size: 30, hasNext: false, counts: emptyCounts });
    render(<HistoryView />);
    expect(await screen.findByText(/아직 활동 기록이 없어요/)).toBeInTheDocument();
  });

  it("데이터 — 회사·from→to·actor 렌더", async () => {
    fetchMock.mockResolvedValue({
      activities: [{
        id: 1, type: "STAGE_CHANGED", icon: "Check", tone: "ok", actor: "내",
        subject: "네이버 · 백엔드", fromLabel: "서류 제출", toLabel: "1차 면접",
        suffix: "으로 변경됐어요.", occurredAt: "2026-06-09T08:32:00Z",
      }],
      totalCount: 1, page: 0, size: 30, hasNext: false,
      counts: { ...emptyCounts, STAGE: 1 },
    });
    render(<HistoryView />);
    expect(await screen.findByText("네이버 · 백엔드")).toBeInTheDocument();
    expect(screen.getByText("서류 제출")).toBeInTheDocument();
    expect(screen.getByText("1차 면접")).toBeInTheDocument();
    expect(screen.getByText("내")).toBeInTheDocument();
  });

  it("필터 칩 클릭 — 해당 category 로 재조회", async () => {
    fetchMock.mockResolvedValue({ activities: [], totalCount: 0, page: 0, size: 30, hasNext: false, counts: emptyCounts });
    render(<HistoryView />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith({ category: undefined, page: 0, size: 30 }));
    fireEvent.click(screen.getByText("전형 변경"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith({ category: "STAGE", page: 0, size: 30 }));
  });
});
