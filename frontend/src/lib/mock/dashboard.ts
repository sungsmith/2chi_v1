// ============================================================
// Dashboard Mock 데이터 (feat/5.3)
//
// 모든 값은 시안 design_system/pages/dashboard.jsx 와 동일.
// 추후 각 도메인 (5.4~5.8) 완성 시 위젯의 props 소스를 실 API 로 교체.
// ============================================================

export type GreetingTag = {
  label: string;
  tone?: "mint" | "lav" | "peach"; // .greet-tag.mint/.lav/.peach 매핑
};

export const GREETING_TAGS: GreetingTag[] = [
  { label: "백엔드" },
  { label: "중고신입 (2년차)", tone: "mint" },
  { label: "이직 준비 중", tone: "lav" },
];

export type KpiCompletenessPart = {
  name: string;
  pct: number;
  tone?: "mint" | "peach"; // .bar-row.mint/.peach 매핑
};

export type KpiCompletenessData = {
  total: number;
  parts: KpiCompletenessPart[];
};

export const KPI_COMPLETENESS_MOCK: KpiCompletenessData = {
  total: 72,
  parts: [
    { name: "이력서", pct: 90, tone: "mint" },
    { name: "경력 기술", pct: 70 },
    { name: "포트폴리오", pct: 55, tone: "peach" },
  ],
};

export type KpiCoverLettersMini = {
  k: string;
  v: number;
  unit: string;
};

export type KpiCoverLettersData = {
  total: number;
  totalUnit: string;
  mini: KpiCoverLettersMini[];
};

export const KPI_COVER_LETTERS_MOCK: KpiCoverLettersData = {
  total: 14,
  totalUnit: "건",
  mini: [
    { k: "이번 달", v: 5, unit: "건" },
    { k: "마스터", v: 6, unit: "개" },
    { k: "변형본", v: 14, unit: "개" },
  ],
};

export type KpiInProgressStage = {
  label: string;
  n: number;
  cls: "doc" | "code" | "int1" | "int2" | "exec";
};

export type KpiInProgressData = {
  total: number;
  totalUnit: string;
  stages: KpiInProgressStage[];
};

export const KPI_IN_PROGRESS_MOCK: KpiInProgressData = {
  total: 7,
  totalUnit: "건",
  stages: [
    { label: "서류", n: 3, cls: "doc" },
    { label: "코테", n: 1, cls: "code" },
    { label: "1차면접", n: 2, cls: "int1" },
    { label: "2차면접", n: 1, cls: "int2" },
  ],
};

export type ScheduleItem = {
  stage: string;       // "1차면접" | "코딩테스트" | "서류마감" | "임원면접"
  stageCls: "int1" | "int2" | "code" | "doc" | "exec";
  company: string;
  role: string;
  month: string;       // "MAY"
  day: string;         // "10"
  weekday: string;     // "MON"
  time: string;        // "14:00" | "23:59"
  dday: string;        // "D-2" | "오늘"
  soon?: boolean;
};

export const UPCOMING_MOCK: ScheduleItem[] = [
  {
    stage: "1차면접",
    stageCls: "int1",
    company: "(주)테크컴퍼니",
    role: "백엔드 (경력 2~5년)",
    month: "MAY",
    day: "10",
    weekday: "MON",
    time: "14:00",
    dday: "D-2",
    soon: true,
  },
  {
    stage: "코딩테스트",
    stageCls: "code",
    company: "네이버",
    role: "백엔드 신입 / 주니어",
    month: "MAY",
    day: "11",
    weekday: "TUE",
    time: "10:00",
    dday: "D-3",
  },
  {
    stage: "서류마감",
    stageCls: "doc",
    company: "카카오",
    role: "백엔드 (Saas 팀)",
    month: "MAY",
    day: "12",
    weekday: "WED",
    time: "23:59",
    dday: "오늘",
  },
  {
    stage: "임원면접",
    stageCls: "exec",
    company: "토스",
    role: "Server Engineer",
    month: "MAY",
    day: "14",
    weekday: "FRI",
    time: "16:00",
    dday: "D-6",
  },
];

export type MatchRing = {
  percent: number;
  position: string;
  metricLabel: string;
  description: string;
};

export type Gap = {
  name: string;
  sub: string;
  hit: string;
};

export const MATCH_RING_MOCK: MatchRing = {
  percent: 68,
  position: "희망 포지션 · 백엔드",
  metricLabel: "JD 평균 매칭률",
  description: "최근 등록한 채용공고 8건을 기준으로, 이력과 키워드 매칭을 비교했어요.",
};

export const GAPS_MOCK: Gap[] = [
  { name: "Kafka / MSA 운영 경험",        sub: "결제·정산 도메인 공고에서 자주 언급",   hit: "5건" },
  { name: "대용량 트래픽 처리 (TPS 5K+)", sub: "관련 프로젝트 정량 결과 보완 추천",     hit: "4건" },
  { name: "관측성(Observability) 도구",   sub: "Datadog · Grafana · OpenTelemetry",     hit: "3건" },
];

export const TODAY_QUOTE_MOCK = "이번 주는 1차 면접 두 곳,\n차근히 준비해봐요.";
