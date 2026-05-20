"use client";

import { Target, TARGET_META } from "@/lib/enums/target";
import { TargetJob, TARGET_JOB_META } from "@/lib/enums/target-job";
import { NotebookPen, FileText, Edit } from "./icons";

const SAMPLES = [
  { kbd: "01", title: "내 경험 정리",         desc: "프로젝트·성과를 PRAR 구조로 차곡차곡", icon: <NotebookPen />, tone: 1 },
  { kbd: "02", title: "자소서 초안 생성",     desc: "정리된 경험으로 마스터 자소서 한 벌",  icon: <FileText />,    tone: 2 },
  { kbd: "03", title: "채용공고별 맞춤 수정", desc: "공고 키워드에 맞춰 변형본을 만들어요", icon: <Edit />,        tone: 3 },
];

type Props = {
  target: Target | undefined;
  careerYear: number | undefined;
  targetJobs: Set<TargetJob>;
};

function formatCareer(careerYear: number | undefined): string {
  if (careerYear === undefined) return "—";
  if (careerYear === 0) return "신입 0년";
  if (careerYear >= 7) return "7+ 년차 이상";
  return `${careerYear} 년차`;
}

export function StepRecap({ target, careerYear, targetJobs }: Props) {
  const purposeLabel = target ? TARGET_META[target].title : "—";
  const careerLabel = formatCareer(careerYear);
  const positionLabel = targetJobs.size > 0
    ? [...targetJobs].map((j) => TARGET_JOB_META[j].name).join(" · ")
    : "—";

  return (
    <div className="onb-scene entering">
      <div className="eyebrow">STEP 4 / 4</div>
      <h2>내 경험을 한 번 정리하면,</h2>
      <p className="sub">모든 취업 준비가 조금 더 가벼워져요. 알려주신 정보로 이런 흐름이 자동으로 연결돼요.</p>

      <div className="recap">
        <div className="recap-row"><span className="recap-k">준비</span><b>{purposeLabel}</b></div>
        <div className="recap-divider" />
        <div className="recap-row"><span className="recap-k">경력</span><b>{careerLabel}</b></div>
        <div className="recap-divider" />
        <div className="recap-row"><span className="recap-k">직무</span><b>{positionLabel}</b></div>
      </div>

      <div className="sample-grid">
        {SAMPLES.map((s, i) => (
          <div key={s.kbd} className={`sample-card tone-${s.tone}`}>
            <div className="kbd mono">{s.kbd}</div>
            <div className="sample-ico">{s.icon}</div>
            <div className="sample-title">{s.title}</div>
            <div className="sample-desc">{s.desc}</div>
            {i < SAMPLES.length - 1 && <div className="sample-arrow" aria-hidden>→</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
