export type ItemType =
  | "MOTIVATION"
  | "FUTURE_PLAN"
  | "TEAMWORK"
  | "CONFLICT"
  | "ACHIEVEMENT"
  | "PROBLEM_SOLVING"
  | "STRENGTH"
  | "WEAKNESS"
  | "OTHER";

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  MOTIVATION: "지원동기",
  FUTURE_PLAN: "입사 후 포부",
  TEAMWORK: "협업 경험",
  CONFLICT: "갈등 해결",
  ACHIEVEMENT: "성취 경험",
  PROBLEM_SOLVING: "문제 해결",
  STRENGTH: "본인의 강점",
  WEAKNESS: "본인의 약점",
  OTHER: "기타",
};

export const ITEM_TYPE_ORDER: ItemType[] = [
  "MOTIVATION", "FUTURE_PLAN", "TEAMWORK", "CONFLICT",
  "ACHIEVEMENT", "PROBLEM_SOLVING", "STRENGTH", "WEAKNESS", "OTHER",
];

export type CoverLetterMaster = {
  id: number;
  itemType: ItemType;
  title: string | null;
  masterAnswer: string;
  charLimitHint: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CoverLetterMasterSummary = {
  id: number;
  itemType: ItemType;
  title: string | null;
  charCount: number;
  isDefault: boolean;
  updatedAt: string;
};

export type MasterRequest = {
  itemType: ItemType;
  title?: string | null;
  masterAnswer: string;
  charLimitHint?: number | null;
  isDefault: boolean;
};

export type MasterPatchRequest = Partial<{
  title: string | null;
  masterAnswer: string;
  charLimitHint: number | null;
  isDefault: boolean;
}>;

export type DeleteResult = {
  newDefaultId: number | null;
};
