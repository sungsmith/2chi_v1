import { describe, it, expect } from "vitest";
import {
  computeCompleteness,
  computeCoverLetters,
  computeInProgress,
} from "../aggregate";
import type { ProfileBasic, Education } from "@/lib/types/me-profile";
import type { Career } from "@/lib/types/career";
import type { VariantListGroup, VariantSummary } from "@/lib/types/cover-letter";
import type { ApplicationSummary, Stage } from "@/lib/types/application";

const emptyProfile: ProfileBasic = {
  name: null, birthDate: null, phone: null, region: null, introduction: null,
  target: null, careerYear: null, targetJobs: [], onboardingCompleted: false,
};

function variant(over: Partial<VariantSummary>): VariantSummary {
  return {
    id: 1, itemType: "MOTIVATION", question: "Q", charLimit: 500,
    charCount: 100, status: "DRAFT", updatedAt: "2026-06-01T00:00:00Z", ...over,
  };
}
function group(variants: VariantSummary[]): VariantListGroup {
  return { posting: { id: 1, company: "회사", title: "백엔드" }, variants };
}
function app(stage: Stage, result: ApplicationSummary["currentResult"]): ApplicationSummary {
  return {
    id: 1, postingId: 1, company: "회사", role: "백엔드",
    currentStage: stage, currentResult: result, variantsCount: 0,
    nextEvent: null, updatedAt: "2026-06-01T00:00:00Z",
  };
}

describe("computeCompleteness (공식 A)", () => {
  it("빈 프로필 — 모든 영역 0", () => {
    const r = computeCompleteness(emptyProfile, [], [], []);
    expect(r.total).toBe(0);
    expect(r.parts.map((p) => p.pct)).toEqual([0, 0, 0]);
  });

  it("기본정보 부분 채움 — 5개 중 2개 = 40%", () => {
    const profile = { ...emptyProfile, name: "홍길동", phone: "010-0000-0000" };
    const r = computeCompleteness(profile, [], [], []);
    expect(r.parts[0].pct).toBe(40);
  });

  it("공백 문자열은 미작성으로 처리", () => {
    const profile = { ...emptyProfile, name: "   ", phone: "010" };
    const r = computeCompleteness(profile, [], [], []);
    expect(r.parts[0].pct).toBe(20); // phone 1개만
  });

  it("경력만 있으면 50, 학력+경력이면 100", () => {
    const careers = [{} as Career];
    const edus = [{} as Education];
    expect(computeCompleteness(emptyProfile, [], careers, []).parts[1].pct).toBe(50);
    expect(computeCompleteness(emptyProfile, edus, careers, []).parts[1].pct).toBe(100);
  });

  it("자소서 변형본 보유 → 100, 없으면 0", () => {
    const g = [group([variant({})])];
    expect(computeCompleteness(emptyProfile, [], [], g).parts[2].pct).toBe(100);
    expect(computeCompleteness(emptyProfile, [], [], []).parts[2].pct).toBe(0);
  });

  it("total = 3개 영역 평균", () => {
    const profile = { ...emptyProfile, name: "a", birthDate: "b", phone: "c", region: "d", introduction: "e" }; // 100
    const r = computeCompleteness(profile, [{} as Education], [{} as Career], [group([variant({})])]);
    expect(r.total).toBe(100);
  });
});

describe("computeCoverLetters", () => {
  it("빈 입력 — 0건", () => {
    const r = computeCoverLetters([], new Date("2026-06-09"));
    expect(r.total).toBe(0);
    expect(r.mini.map((m) => m.v)).toEqual([0, 0, 0]);
  });

  it("이번 달 / 작성중 / 제출완료 집계", () => {
    const g = [
      group([
        variant({ id: 1, status: "DRAFT", updatedAt: "2026-06-05T00:00:00Z" }),
        variant({ id: 2, status: "COMPLETED", updatedAt: "2026-06-02T00:00:00Z" }),
        variant({ id: 3, status: "COMPLETED", updatedAt: "2026-04-10T00:00:00Z" }),
      ]),
    ];
    const r = computeCoverLetters(g, new Date("2026-06-09"));
    expect(r.total).toBe(3);
    expect(r.mini[0]).toMatchObject({ k: "이번 달", v: 2 }); // 6월 2건
    expect(r.mini[1]).toMatchObject({ k: "작성중", v: 1 });
    expect(r.mini[2]).toMatchObject({ k: "제출완료", v: 2 });
  });

  it("마스터 mini 는 더 이상 없음", () => {
    const r = computeCoverLetters([], new Date("2026-06-09"));
    expect(r.mini.find((m) => m.k === "마스터")).toBeUndefined();
  });
});

describe("computeInProgress", () => {
  it("IN_PROGRESS 만 집계, 합격/탈락 제외", () => {
    const apps = [
      app("DOC_SUBMITTED", "IN_PROGRESS"),
      app("FIRST_INTERVIEW", "IN_PROGRESS"),
      app("PASSED", "PASSED"),
      app("FAILED", "FAILED"),
    ];
    const r = computeInProgress(apps);
    expect(r.total).toBe(2);
  });

  it("단계별 그룹 + 표준 순서 정렬", () => {
    const apps = [
      app("FIRST_INTERVIEW", "IN_PROGRESS"),
      app("DOC_SUBMITTED", "IN_PROGRESS"),
      app("DOC_SUBMITTED", "IN_PROGRESS"),
    ];
    const r = computeInProgress(apps);
    expect(r.stages).toEqual([
      { label: "서류", n: 2, cls: "doc" },
      { label: "1차면접", n: 1, cls: "int1" },
    ]);
  });

  it("진행 중 없으면 빈 배열", () => {
    expect(computeInProgress([]).stages).toEqual([]);
  });
});
