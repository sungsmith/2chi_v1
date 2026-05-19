export const TARGET_JOBS = ["BACKEND", "FRONTEND", "INFRA_CLOUD", "INFRA_OPS", "UI_UX"] as const;
export type TargetJob = typeof TARGET_JOBS[number];

export const TARGET_JOB_META: Record<TargetJob, { name: string; desc: string }> = {
  BACKEND:     { name: "Backend",       desc: "서버·API·DB" },
  FRONTEND:    { name: "Frontend",      desc: "웹·앱 화면 구현" },
  INFRA_CLOUD: { name: "Infra / Cloud", desc: "AWS·GCP·K8s" },
  INFRA_OPS:   { name: "Infra / Ops",   desc: "VMware·NAS·백신·백업·네트워크" },
  UI_UX:       { name: "UI / UX",       desc: "제품·서비스 디자인" },
};
