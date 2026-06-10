import { describe, it, expect } from "vitest";
import { buildGreetingTags } from "../greeting-tags";

describe("buildGreetingTags", () => {
  it("직무(한글)·경력·준비상태 순서로 매핑", () => {
    const tags = buildGreetingTags({ target: "JOB_CHANGE", careerYear: 2, targetJobs: ["BACKEND"] });
    expect(tags).toEqual([
      { label: "백엔드" },
      { label: "2년차", tone: "mint" },
      { label: "이직 준비 중", tone: "lav" },
    ]);
  });

  it("직무 여러 개는 각각 한글 라벨", () => {
    const tags = buildGreetingTags({ target: null, careerYear: null, targetJobs: ["BACKEND", "UI_UX"] });
    expect(tags.map((t) => t.label)).toEqual(["백엔드", "UI/UX"]);
  });

  it("careerYear 0=신입 / 7+=7년차 이상", () => {
    expect(buildGreetingTags({ target: null, careerYear: 0, targetJobs: [] })[0].label).toBe("신입");
    expect(buildGreetingTags({ target: null, careerYear: 9, targetJobs: [] })[0].label).toBe("7년차 이상");
  });

  it("취업 target 라벨", () => {
    const tags = buildGreetingTags({ target: "EMPLOYMENT", careerYear: null, targetJobs: [] });
    expect(tags).toEqual([{ label: "취업 준비 중", tone: "lav" }]);
  });

  it("값 없으면 빈 배열, 잘못된 값은 건너뜀", () => {
    expect(buildGreetingTags({ target: null, careerYear: null, targetJobs: [] })).toEqual([]);
    expect(buildGreetingTags({ target: "BOGUS", careerYear: null, targetJobs: ["NOPE"] })).toEqual([]);
  });
});
