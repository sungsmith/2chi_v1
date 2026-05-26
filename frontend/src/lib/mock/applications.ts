export type KanbanCard = {
  id: string;
  co: string;
  pos: string;
  dday: string;   // "D-19" / "D-3" etc.
  soon?: boolean; // true → pink dday-pill, false/undefined → cool (grey)
  added: string;  // "5일 전" / "오늘" / "5/10 14:00" etc.
};

export type KanbanColumn = {
  id: "doc" | "code" | "int1" | "int2" | "exec";
  label: string;
  count: number;
  items: KanbanCard[];
};

export const KAN_COLS_MOCK: KanbanColumn[] = [
  {
    id: "doc",
    label: "서류",
    count: 3,
    items: [
      { id: "doc-1", co: "(주)테크컴퍼니", pos: "백엔드 (경력 2~5년)", dday: "D-19", added: "5일 전" },
      { id: "doc-2", co: "쿠팡",           pos: "백엔드 (라스트마일)", dday: "D-14", added: "1주 전" },
      { id: "doc-3", co: "당근",           pos: "Server Engineer · 결제", dday: "D-7", soon: true, added: "오늘" },
    ],
  },
  {
    id: "code",
    label: "코딩테스트",
    count: 1,
    items: [
      { id: "code-1", co: "네이버", pos: "백엔드 신입 / 주니어", dday: "D-3", soon: true, added: "내일 10:00" },
    ],
  },
  {
    id: "int1",
    label: "1차면접",
    count: 2,
    items: [
      { id: "int1-1", co: "(주)테크컴퍼니", pos: "백엔드 (경력 2~5년)", dday: "D-2", soon: true, added: "5/10 14:00" },
      { id: "int1-2", co: "라인",           pos: "Server Engineer",     dday: "D-12", added: "5/22 10:00" },
    ],
  },
  {
    id: "int2",
    label: "2차면접",
    count: 1,
    items: [
      { id: "int2-1", co: "토스", pos: "Server Engineer", dday: "D-7", soon: true, added: "5/17 11:00" },
    ],
  },
  {
    id: "exec",
    label: "임원면접",
    count: 1,
    items: [
      { id: "exec-1", co: "토스", pos: "Server Engineer", dday: "D-4", soon: true, added: "5/14 16:00" },
    ],
  },
];

export type HistoryEntry = {
  id: string;
  time: string;           // "17:32" / "14:08"
  icon: string;           // icon name from Ico
  iconTone?: "ok" | "fail" | "warn"; // optional tone class
  msg: string;            // plain text message (JSX rich nodes serialized)
  actor: string;          // "시스템 · 면접 일정 등록" / "김소미"
  // rich msg nodes for rendering
  msgParts?: {
    bold?: string;
    stageFrom?: string;
    stageTo?: string;
    suffix?: string;
  };
};

export const HISTORY_MOCK: HistoryEntry[] = [
  {
    id: "h-1",
    time: "17:32",
    icon: "Check",
    iconTone: "ok",
    msg: "(주)테크컴퍼니 · 백엔드 — 서류 → 1차면접으로 변경됐어요.",
    actor: "시스템 · 면접 일정 등록",
    msgParts: { bold: "(주)테크컴퍼니 · 백엔드", stageFrom: "서류", stageTo: "1차면접", suffix: "로 변경됐어요." },
  },
  {
    id: "h-2",
    time: "14:08",
    icon: "FileEdit",
    msg: "카카오 X 결제·정산 백엔드 자소서가 저장됐어요. 3건 표현이 검토 대상으로 표시됨.",
    actor: "김소미",
    msgParts: { bold: "카카오 X 결제·정산 백엔드", suffix: " 자소서가 저장됐어요. 3건 표현이 검토 대상으로 표시됨." },
  },
  {
    id: "h-3",
    time: "09:01",
    icon: "Bell",
    iconTone: "warn",
    msg: "카카오 백엔드 (Saas 팀) 서류 마감이 D-3으로 가까워졌어요.",
    actor: "시스템 · 알림",
    msgParts: { bold: "카카오 백엔드 (Saas 팀)", stageTo: "D-3", suffix: "으로 가까워졌어요." },
  },
  {
    id: "h-4",
    time: "20:14",
    icon: "Sparkle",
    iconTone: "ok",
    msg: "네이버 신입 백엔드 AI 초안 생성 완료 — 매칭률 81%로 측정됐어요.",
    actor: "AI · 자소서 초안",
    msgParts: { bold: "네이버 신입 백엔드", suffix: " AI 초안 생성 완료 — 매칭률 81%로 측정됐어요." },
  },
  {
    id: "h-5",
    time: "11:42",
    icon: "Plus",
    msg: "쿠팡 백엔드 (라스트마일) 공고를 등록했어요. 자소서 매칭률 70%.",
    actor: "김소미",
    msgParts: { bold: "쿠팡 백엔드 (라스트마일)", suffix: " 공고를 등록했어요. 자소서 매칭률 70%." },
  },
  {
    id: "h-6",
    time: "22:01",
    icon: "X",
    iconTone: "fail",
    msg: "당근 Server Engineer · 결제 — 1차면접 → 불합격으로 변경됐어요.",
    actor: "김소미 · 결과 입력",
    msgParts: { bold: "당근 Server Engineer · 결제", stageFrom: "1차면접", stageTo: "불합격", suffix: "으로 변경됐어요." },
  },
];
