import type { NotificationIconTone } from "@/lib/types/notification";

export type NotificationPresentation = {
  icon: "Bell" | "Check" | "Sparkle" | "FileEdit" | "Plus";
  tone: NotificationIconTone;
};

/**
 * BE NotificationType (V1 type CHECK) → FE icon/tone 매핑.
 * 미래 type 추가 시 FALLBACK 적용 (안전 default).
 */
const MAP: Record<string, NotificationPresentation> = {
  POSTING_DEADLINE_D3:          { icon: "Bell",     tone: "warn"    },
  POSTING_DEADLINE_D1:          { icon: "Bell",     tone: "pink"    },
  SCHEDULE_D1:                  { icon: "Check",    tone: "mint"    },
  COVER_LETTER_UNSUBMITTED_7D:  { icon: "FileEdit", tone: "mint"    },
  WEEKLY_SUMMARY:               { icon: "Sparkle",  tone: "default" },
  EMAIL_VERIFY:                 { icon: "Bell",     tone: "lav"     },
  PASSWORD_RESET:               { icon: "Bell",     tone: "lav"     },
};

const FALLBACK: NotificationPresentation = { icon: "Bell", tone: "default" };

export function notificationPresentation(type: string): NotificationPresentation {
  return MAP[type] ?? FALLBACK;
}
