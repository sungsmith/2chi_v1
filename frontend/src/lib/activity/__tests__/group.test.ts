import { describe, it, expect } from "vitest";
import { groupByDay, toTime, toEntry } from "../group";
import type { ActivityItem } from "@/lib/types/activity";

const item = (over: Partial<ActivityItem>): ActivityItem => ({
  id: 1, type: "STAGE_CHANGED", icon: "Check", tone: "ok", actor: "내",
  subject: "네이버 · 백엔드", fromLabel: "서류 제출", toLabel: "1차 면접",
  suffix: "으로 변경됐어요.", occurredAt: "2026-06-09T08:32:00Z", ...over,
});

describe("toTime", () => {
  it("ISO → HH:MM 형식", () => {
    expect(toTime("2026-06-09T08:32:00Z")).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("toEntry", () => {
  it("ActivityItem → HistoryEntry (msgParts 매핑)", () => {
    const e = toEntry(item({}));
    expect(e.icon).toBe("Check");
    expect(e.iconTone).toBe("ok");
    expect(e.msgParts).toEqual({
      bold: "네이버 · 백엔드", stageFrom: "서류 제출",
      stageTo: "1차 면접", suffix: "으로 변경됐어요.",
    });
    expect(e.msg).toContain("네이버 · 백엔드");
  });
  it("subject/from/to 가 null 이면 msgParts 에서 제외", () => {
    const e = toEntry(item({ subject: null, fromLabel: null, toLabel: null, suffix: "서류 마감이 가까워졌어요." }));
    expect(e.msgParts?.bold).toBeUndefined();
    expect(e.msgParts?.stageFrom).toBeUndefined();
    expect(e.msgParts?.suffix).toBe("서류 마감이 가까워졌어요.");
  });
  it("tone null → iconTone undefined", () => {
    const e = toEntry(item({ tone: null }));
    expect(e.iconTone).toBeUndefined();
  });
});

describe("groupByDay (로컬 일자 기준)", () => {
  it("같은 로컬 날짜끼리 묶고 라벨·카운트 생성, 오늘 표시", () => {
    // 로컬 시간 컴포넌트로 구성 → 러너 타임존과 무관하게 그룹핑이 결정적.
    const today = new Date(2026, 5, 9, 12, 0, 0); // 로컬 6/9 12:00
    const items = [
      item({ id: 1, occurredAt: new Date(2026, 5, 9, 8, 0, 0).toISOString() }),  // 로컬 6/9
      item({ id: 2, occurredAt: new Date(2026, 5, 9, 20, 0, 0).toISOString() }), // 로컬 6/9
      item({ id: 3, occurredAt: new Date(2026, 5, 8, 9, 0, 0).toISOString() }),  // 로컬 6/8
    ];
    const groups = groupByDay(items, today);
    expect(groups.length).toBe(2);
    expect(groups[0].rows.length).toBe(2);
    expect(groups[0].label).toContain("· 오늘");
    expect(groups[0].label).toContain("2026.06.09");
    expect(groups[1].rows.length).toBe(1);
    expect(groups[1].label).not.toContain("· 오늘");
  });
});
