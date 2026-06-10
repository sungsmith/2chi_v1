export const TARGET_JOBS = ["BACKEND", "FRONTEND", "INFRA_CLOUD", "INFRA_OPS", "UI_UX"] as const;
export type TargetJob = typeof TARGET_JOBS[number];

export const TARGET_JOB_META: Record<TargetJob, { name: string; nameKo: string; desc: string }> = {
  BACKEND:     { name: "Backend",       nameKo: "백엔드",        desc: "서버·API·DB" },
  FRONTEND:    { name: "Frontend",      nameKo: "프론트엔드",    desc: "웹·앱 화면 구현" },
  INFRA_CLOUD: { name: "Infra / Cloud", nameKo: "인프라/클라우드", desc: "AWS·GCP·K8s" },
  INFRA_OPS:   { name: "Infra / Ops",   nameKo: "인프라/운영",    desc: "VMware·NAS·백신·백업·네트워크" },
  UI_UX:       { name: "UI / UX",       nameKo: "UI/UX",         desc: "제품·서비스 디자인" },
};
