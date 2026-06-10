import { TARGET_META, type Target } from "@/lib/enums/target";
import { TARGET_JOB_META, type TargetJob } from "@/lib/enums/target-job";
import type { GreetingTag } from "@/lib/mock/dashboard";

type ProfileLike = {
  target: string | null;
  careerYear: number | null;
  targetJobs: string[];
};

function careerLabel(year: number): string {
  if (year === 0) return "신입";
  if (year >= 7) return "7년차 이상";
  return `${year}년차`;
}

/** 온보딩 프로필(target/careerYear/targetJobs)을 인사 영역 태그로 변환. 순서: 직무 → 경력 → 준비 상태. */
export function buildGreetingTags(profile: ProfileLike): GreetingTag[] {
  const tags: GreetingTag[] = [];

  for (const job of profile.targetJobs ?? []) {
    const meta = TARGET_JOB_META[job as TargetJob];
    if (meta) tags.push({ label: meta.nameKo });
  }

  if (profile.careerYear != null) {
    tags.push({ label: careerLabel(profile.careerYear), tone: "mint" });
  }

  if (profile.target) {
    const meta = TARGET_META[profile.target as Target];
    if (meta) tags.push({ label: meta.title, tone: "lav" });
  }

  return tags;
}
