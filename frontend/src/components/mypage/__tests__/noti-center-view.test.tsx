import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotiCenterView } from "../noti-center-view";
import type { NotificationItem } from "@/lib/types/notification";

const fetchNotificationsMock = vi.fn();
const markAllReadMock = vi.fn();
const deleteAllMock = vi.fn();

vi.mock("@/lib/api/notification", () => ({
  fetchNotifications: (...args: unknown[]) => fetchNotificationsMock(...args),
  markAllRead: (...args: unknown[]) => markAllReadMock(...args),
  deleteAllNotifications: (...args: unknown[]) => deleteAllMock(...args),
}));

const sample: NotificationItem[] = [
  { id: 1, type: "POSTING_DEADLINE_D1", title: "카카오 서류 마감", body: null, createdAt: "2026-05-27T09:00:00Z", readAt: null },
  { id: 2, type: "SCHEDULE_D1",         title: "면접 일정 등록",  body: null, createdAt: "2026-05-26T17:32:00Z", readAt: "2026-05-26T18:00:00Z" },
];

beforeEach(() => {
  fetchNotificationsMock.mockReset();
  markAllReadMock.mockReset();
  deleteAllMock.mockReset();
});

describe("NotiCenterView", () => {
  it("renders notifications after fetch", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    render(<NotiCenterView />);

    expect(await screen.findByText("카카오 서류 마감")).toBeInTheDocument();
    expect(screen.getByText("면접 일정 등록")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: [] });
    render(<NotiCenterView />);
    expect(await screen.findByText(/아직 받은 알림이 없어요/)).toBeInTheDocument();
  });

  it("mark-all-read button optimistically updates and calls API", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    markAllReadMock.mockResolvedValueOnce(undefined);

    render(<NotiCenterView />);
    await screen.findByText("카카오 서류 마감");

    await userEvent.click(screen.getByRole("button", { name: /모두 읽음/ }));
    await waitFor(() => expect(markAllReadMock).toHaveBeenCalled());
  });

  it("mark-all-read failure reverts and shows error", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    markAllReadMock.mockRejectedValueOnce(new Error("읽음 처리에 실패했어요."));

    render(<NotiCenterView />);
    await screen.findByText("카카오 서류 마감");

    await userEvent.click(screen.getByRole("button", { name: /모두 읽음/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("읽음 처리에 실패했어요.");
  });

  it("delete-all button opens DeleteAllConfirmModal", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    render(<NotiCenterView />);
    await screen.findByText("카카오 서류 마감");

    await userEvent.click(screen.getByRole("button", { name: /전체 삭제/ }));
    expect(screen.getByRole("heading", { name: "알림 전체 삭제" })).toBeInTheDocument();
  });

  it("delete-all modal cancel does not call API", async () => {
    fetchNotificationsMock.mockResolvedValueOnce({ notifications: sample });
    render(<NotiCenterView />);
    await screen.findByText("카카오 서류 마감");

    await userEvent.click(screen.getByRole("button", { name: /전체 삭제/ }));
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));

    expect(deleteAllMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "알림 전체 삭제" })).not.toBeInTheDocument();
  });
});
