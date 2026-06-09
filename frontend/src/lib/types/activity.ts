export type ActivityType =
  | "APPLICATION_CREATED"
  | "STAGE_CHANGED"
  | "COVER_LETTER_SAVED"
  | "AI_DRAFT_GENERATED"
  | "NOTIFICATION";

export type ActivityCategory = "STAGE" | "COVER_LETTER" | "NOTIFICATION" | "APPLICATION";

export type ActivityItem = {
  id: number;
  type: ActivityType;
  icon: string;
  tone: "ok" | "fail" | "warn" | null;
  actor: string;
  subject: string | null;
  fromLabel: string | null;
  toLabel: string | null;
  suffix: string;
  occurredAt: string; // ISO
};

export type ActivityListResponse = {
  activities: ActivityItem[];
  totalCount: number;
  page: number;
  size: number;
  hasNext: boolean;
  counts: Record<ActivityCategory, number>;
};
