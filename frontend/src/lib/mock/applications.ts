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
