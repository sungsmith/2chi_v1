// ============================================================
// 대시보드 KPI 집계 (feat/5.3)
//
// 순수 함수 모음 — 도메인 API 응답을 KPI 위젯 props 로 변환.
// 매칭 분석(MatchPanel)은 v2 로 보류(준비 중 플레이스홀더).
// ============================================================

import type { ProfileBasic, Education } from "@/lib/types/me-profile";
import type { Career } from "@/lib/types/career";
import type { VariantListGroup } from "@/lib/types/cover-letter";
import type { ApplicationSummary, Stage } from "@/lib/types/application";
import type {
  KpiCompletenessData,
  KpiCoverLettersData,
  KpiInProgressData,
  KpiInProgressStage,
} from "@/lib/mock/dashboard";

// ── 완성도 (공식 A): 3개 영역 평균 ───────────────────────────
//  ① 기본 정보 — 이름/생년월일/전화/지역/소개 5개 중 채운 비율
//  ② 경력·학력 — 경력 1건↑(50) + 학력 1건↑(50)
//  ③ 자소서    — 변형본 보유 여부(100/0)
export function computeCompleteness(
  profile: ProfileBasic,
  educations: Education[],
  careers: Career[],
  variants: VariantListGroup[]
): KpiCompletenessData {
  const basicFields = [
    profile.name,
    profile.birthDate,
    profile.phone,
    profile.region,
    profile.introduction,
  ];
  const filled = basicFields.filter((v) => v != null && v.trim() !== "").length;
  const basicPct = Math.round((filled / basicFields.length) * 100);

  const careerEduPct =
    (careers.length > 0 ? 50 : 0) + (educations.length > 0 ? 50 : 0);

  const variantCount = variants.reduce((acc, g) => acc + g.variants.length, 0);
  const clPct = variantCount > 0 ? 100 : 0;

  const total = Math.round((basicPct + careerEduPct + clPct) / 3);

  return {
    total,
    parts: [
      { name: "기본 정보", pct: basicPct, tone: "mint" },
      { name: "경력·학력", pct: careerEduPct },
      { name: "자소서", pct: clPct, tone: "peach" },
    ],
  };
}

// ── 자소서 작성 수 ───────────────────────────────────────────
export function computeCoverLetters(
  groups: VariantListGroup[],
  now: Date
): KpiCoverLettersData {
  const variants = groups.flatMap((g) => g.variants);
  const thisMonth = variants.filter((v) => {
    const d = new Date(v.updatedAt);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }).length;
  const draft = variants.filter((v) => v.status === "DRAFT").length;
  const completed = variants.filter((v) => v.status === "COMPLETED").length;

  return {
    total: variants.length,
    totalUnit: "건",
    mini: [
      { k: "이번 달", v: thisMonth, unit: "건" },
      { k: "작성중", v: draft, unit: "개" },
      { k: "제출완료", v: completed, unit: "개" },
    ],
  };
}

// ── 진행 중인 지원 ───────────────────────────────────────────
const STAGE_DISPLAY: Partial<
  Record<Stage, { label: string; cls: KpiInProgressStage["cls"]; order: number }>
> = {
  DOC_SUBMITTED: { label: "서류", cls: "doc", order: 0 },
  CODING_TEST: { label: "코테", cls: "code", order: 1 },
  FIRST_INTERVIEW: { label: "1차면접", cls: "int1", order: 2 },
  SECOND_INTERVIEW: { label: "2차면접", cls: "int2", order: 3 },
  EXEC_INTERVIEW: { label: "임원면접", cls: "exec", order: 4 },
  NEGOTIATION: { label: "처우협의", cls: "exec", order: 5 },
};

export function computeInProgress(
  apps: ApplicationSummary[]
): KpiInProgressData {
  const inProgress = apps.filter((a) => a.currentResult === "IN_PROGRESS");
  const counts = new Map<Stage, number>();
  for (const a of inProgress) {
    counts.set(a.currentStage, (counts.get(a.currentStage) ?? 0) + 1);
  }

  const stages: (KpiInProgressStage & { order: number })[] = [];
  for (const [stage, n] of counts) {
    const disp = STAGE_DISPLAY[stage];
    if (disp) stages.push({ label: disp.label, n, cls: disp.cls, order: disp.order });
  }
  stages.sort((a, b) => a.order - b.order);

  return {
    total: inProgress.length,
    totalUnit: "건",
    stages: stages.map(({ label, n, cls }) => ({ label, n, cls })),
  };
}
