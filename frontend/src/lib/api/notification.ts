import { http } from "@/lib/api/http";
import type { NotificationListResponse } from "@/lib/types/notification";

export async function fetchNotifications(): Promise<NotificationListResponse> {
  const res = await http("/api/v1/notifications");
  if (!res.ok) throw new Error("알림을 불러오지 못했어요.");
  return res.json() as Promise<NotificationListResponse>;
}

export async function markAllRead(): Promise<void> {
  const res = await http("/api/v1/notifications/read-all", { method: "PATCH" });
  if (!res.ok) throw new Error("읽음 처리에 실패했어요.");
}

export async function deleteAllNotifications(): Promise<void> {
  const res = await http("/api/v1/notifications", { method: "DELETE" });
  if (!res.ok) throw new Error("전체 삭제에 실패했어요.");
}
