export type ClMasterMock = {
  id: string;
  title: string;
  co: string;
  pos: string;
  mark: string;
  variants: number;
  updated: string;
  status: "master";
};

export type ClVariantMock = {
  id: string;
  title: string;
  co: string;
  pos: string;
  mark: string;
  match: number;
  updated: string;
  dday: string | null;
  status: "draft" | "ready";
};

export const MASTERS_MOCK: ClMasterMock[] = [
  {
    id: "m1",
    title: "백엔드 마스터 자소서",
    co: "공통",
    pos: "백엔드 개발자",
    mark: "마",
    variants: 6,
    updated: "어제",
    status: "master",
  },
  {
    id: "m2",
    title: "신입 백엔드 마스터 (중고신입 톤)",
    co: "공통",
    pos: "백엔드 · 중고신입",
    mark: "신",
    variants: 3,
    updated: "3일 전",
    status: "master",
  },
];

export const CL_FILTERS = [
  { id: "all",   nm: "전체",    n: 14 },
  { id: "draft", nm: "작성중",  n: 5  },
  { id: "ready", nm: "제출완료", n: 7  },
  { id: "trash", nm: "휴지통",  n: 2  },
];

export type ClTrashItemMock = {
  id: string;
  title: string;
  kind: "master" | "variant";
  deletedAt: string;     // ISO date
  daysUntilPurge: number;
};

export const TRASH_MOCK: ClTrashItemMock[] = [
  { id: "t-1", title: "변형본 — 네이버 백엔드 (2026-04)", kind: "variant", deletedAt: "2026-05-12", daysUntilPurge: 22 },
  { id: "t-2", title: "변형본 — 카카오 백엔드 (2026-04)", kind: "variant", deletedAt: "2026-05-05", daysUntilPurge: 15 },
  { id: "t-3", title: "마스터 자소서 (지난 버전)",          kind: "master",  deletedAt: "2026-04-28", daysUntilPurge: 8  },
];

export type PostingPickerMock = {
  id: string;
  company: string;
  title: string;
  selected?: boolean;
};

export type CareerStatementSection = {
  heading: string;       // 예: "Problem", "Approach", "Result"
  bullets: string[];
};

export type CareerStatementResultMock = {
  projectName: string;
  sections: CareerStatementSection[];
  status: "draft" | "ready";
};

export const POSTINGS_FOR_PICKER_MOCK: PostingPickerMock[] = [
  { id: "p-1", company: "네이버",   title: "백엔드 신입 / 주니어",  selected: true },
  { id: "p-2", company: "카카오",   title: "백엔드 (Saas 팀)" },
  { id: "p-3", company: "토스",     title: "Server Engineer" },
  { id: "p-4", company: "(주)테크", title: "백엔드 (경력 2~5년)" },
];

export const CAREER_STATEMENT_RESULT_MOCK: CareerStatementResultMock = {
  projectName: "식권 정산 API · 캐시 적중률 개선",
  sections: [
    { heading: "Problem", bullets: ["월말 정산 API 평균 응답 340ms · 캐시 적중률 23%"] },
    { heading: "Approach", bullets: ["Redis hot-key 분석", "TTL 정책 + write-through 도입"] },
    { heading: "Result",   bullets: ["응답 340ms → 110ms (68% ↓)", "캐시 적중률 71% (3.1x)"] },
  ],
  status: "draft",
};
