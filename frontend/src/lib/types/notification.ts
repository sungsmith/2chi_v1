export type NotificationIconTone = "default" | "mint" | "lav" | "pink" | "warn";

export type NotificationItem = {
  id: number;
  type: string;            // BE NotificationType enum name (e.g. "POSTING_DEADLINE_D3")
  title: string;
  body: string | null;
  createdAt: string;       // ISO 8601
  readAt: string | null;   // ISO 8601 또는 null (unread)
};

export type NotificationListResponse = {
  notifications: NotificationItem[];
};
