export const TARGETS = ["JOB_CHANGE", "EMPLOYMENT"] as const;
export type Target = typeof TARGETS[number];

export const TARGET_META: Record<Target, { title: string; desc: string }> = {
  JOB_CHANGE: { title: "이직 준비 중", desc: "더 잘 맞는 곳으로 옮기려 해요" },
  EMPLOYMENT: { title: "취업 준비 중", desc: "첫 직장을 차분히 찾고 있어요" },
};
