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
