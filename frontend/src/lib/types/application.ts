export type Stage =
  | "DOC_SUBMITTED"
  | "CODING_TEST"
  | "FIRST_INTERVIEW"
  | "SECOND_INTERVIEW"
  | "EXEC_INTERVIEW"
  | "NEGOTIATION"
  | "PASSED"
  | "FAILED";

export type Result = "IN_PROGRESS" | "PASSED" | "FAILED" | "WITHDRAWN";

export type EventType =
  | "DOC_DEADLINE"
  | "CODING_TEST"
  | "FIRST_INTERVIEW"
  | "SECOND_INTERVIEW"
  | "EXEC_INTERVIEW"
  | "NEGOTIATION"
  | "PASSED"
  | "FAILED"
  | "ETC";

export type ApplicationEvent = {
  id: number;
  applicationId: number;
  type: EventType;
  eventDate: string;  // YYYY-MM-DD
  eventTime: string | null;  // HH:MM:SS or null
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Application = {
  id: number;
  postingId: number;
  company: string;
  role: string;
  currentStage: Stage;
  currentResult: Result;
  memo: string | null;
  variantsCount: number;
  events: ApplicationEvent[];
  createdAt: string;
  updatedAt: string;
};

export type ApplicationSummary = {
  id: number;
  postingId: number;
  company: string;
  role: string;
  currentStage: Stage;
  currentResult: Result;
  variantsCount: number;
  nextEvent: ApplicationEvent | null;
  updatedAt: string;
};

export type EventListItem = {
  id: number;
  type: EventType;
  eventDate: string;
  eventTime: string | null;
  memo: string | null;
  applicationId: number;
  company: string;
  role: string;
};

export type ApplicationCreateRequest = { postingId: number };

export type ApplicationPatchRequest = Partial<{
  currentStage: Stage;
  currentResult: Result;
  memo: string;
  company: string;
  role: string;
}>;

export type EventCreateRequest = {
  type: EventType;
  eventDate: string;
  eventTime?: string | null;
  memo?: string | null;
};

export type EventPatchRequest = Partial<EventCreateRequest>;

// ============ 한국어 라벨 매핑 ============

export const STAGE_LABEL: Record<Stage, string> = {
  DOC_SUBMITTED: "서류 제출",
  CODING_TEST: "코딩 테스트",
  FIRST_INTERVIEW: "1차 면접",
  SECOND_INTERVIEW: "2차 면접",
  EXEC_INTERVIEW: "임원 면접",
  NEGOTIATION: "처우 협의",
  PASSED: "합격",
  FAILED: "불합격",
};

export const RESULT_LABEL: Record<Result, string> = {
  IN_PROGRESS: "진행 중",
  PASSED: "합격",
  FAILED: "불합격",
  WITHDRAWN: "포기",
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  DOC_DEADLINE: "서류 마감",
  CODING_TEST: "코딩 테스트",
  FIRST_INTERVIEW: "1차 면접",
  SECOND_INTERVIEW: "2차 면접",
  EXEC_INTERVIEW: "임원 면접",
  NEGOTIATION: "처우 협의",
  PASSED: "합격 통보",
  FAILED: "불합격 통보",
  ETC: "기타",
};

// ============ EventType → 토큰 class (var(--color-stage-*) 매핑) ============

export const EVENT_TYPE_TOKEN_CLASS: Record<EventType, string> = {
  DOC_DEADLINE: "stg-doc",
  CODING_TEST: "stg-coding",
  FIRST_INTERVIEW: "stg-int1",
  SECOND_INTERVIEW: "stg-int2",
  EXEC_INTERVIEW: "stg-exec",
  NEGOTIATION: "stg-nego",
  PASSED: "stg-pass",
  FAILED: "stg-fail",
  ETC: "stg-etc",
};

// Stage → EventType 매핑 (Stage chip 색상에 사용; DOC_SUBMITTED 는 DOC_DEADLINE 토큰 빌림)
export const STAGE_TO_EVENT_TYPE: Record<Stage, EventType> = {
  DOC_SUBMITTED: "DOC_DEADLINE",
  CODING_TEST: "CODING_TEST",
  FIRST_INTERVIEW: "FIRST_INTERVIEW",
  SECOND_INTERVIEW: "SECOND_INTERVIEW",
  EXEC_INTERVIEW: "EXEC_INTERVIEW",
  NEGOTIATION: "NEGOTIATION",
  PASSED: "PASSED",
  FAILED: "FAILED",
};
