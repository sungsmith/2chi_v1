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

// ===== Variant (5.7) =====

export type VariantStatus = "DRAFT" | "COMPLETED";

export const ITEM_TYPE_QUESTIONS: Record<ItemType, string> = {
  MOTIVATION: "우리 회사에 지원한 이유를 작성해주세요.",
  FUTURE_PLAN: "입사 후 어떻게 성장하고 기여하고 싶은지 작성해주세요.",
  TEAMWORK: "팀에서 협업하며 성과를 낸 경험을 작성해주세요.",
  CONFLICT: "갈등을 해결한 경험을 작성해주세요.",
  ACHIEVEMENT: "가장 큰 성취 경험을 작성해주세요.",
  PROBLEM_SOLVING: "어려운 문제를 해결한 경험을 작성해주세요.",
  STRENGTH: "본인의 강점을 작성해주세요.",
  WEAKNESS: "본인의 약점과 극복 방법을 작성해주세요.",
  OTHER: "자유 항목 — 내용을 작성해주세요.",
};

export type CoverLetterVariant = {
  id: number;
  postingId: number | null;
  postingCompany: string;
  postingTitle: string;
  analysisId: number | null;
  itemType: ItemType;
  question: string;
  charLimit: number;
  aiDraft: string | null;
  userEdit: string | null;
  userRequest: string | null;
  validationJson: string | null;
  status: VariantStatus;
  aiModel: string | null;
  aiTokensUsed: number | null;
  createdAt: string;
  updatedAt: string;
};

export type VariantSummary = {
  id: number;
  itemType: ItemType;
  question: string;
  charLimit: number;
  charCount: number;
  status: VariantStatus;
  updatedAt: string;
};

export type VariantListGroup = {
  posting: { id: number | null; company: string; title: string };
  variants: VariantSummary[];
};

export type VariantCreateRequest = {
  postingId: number;
  analysisId?: number | null;
  itemType: ItemType;
  question: string;
  charLimit: number;
  userRequest?: string;
};

export type VariantPatchRequest = Partial<{
  userEdit: string;
  userRequest: string;
  status: VariantStatus;
}>;

export type ValidationResult = {
  charCount: number;
  charLimitOk: boolean;
  matchedKeywords: string[];
  matchCount: number;
  matchOk: boolean;
};
