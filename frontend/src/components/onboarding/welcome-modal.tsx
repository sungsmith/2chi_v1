"use client";

import { Target, TARGET_META } from "@/lib/enums/target";
import { TargetJob, TARGET_JOB_META } from "@/lib/enums/target-job";

type Props = {
  target: Target;
  careerYear: number;
  targetJobs: Set<TargetJob>;
  onDismiss: () => void;
};

function formatCareer(careerYear: number): string {
  if (careerYear === 0) return "신입 0년";
  if (careerYear >= 7) return "7+ 년차 이상";
  return `${careerYear} 년차`;
}

export function WelcomeModal({ target, careerYear, targetJobs, onDismiss }: Props) {
  const purposeLabel = TARGET_META[target].title;
  const careerLabel = formatCareer(careerYear);
  const positionLabel = targetJobs.size > 0
    ? [...targetJobs].map((j) => TARGET_JOB_META[j].name).join(" · ")
    : "—";

  return (
    <div className="onb-welcome" onClick={onDismiss}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <span className="mascot-cloud lg">
          <span className="blush" />
        </span>
        <h3>준비 다 됐어요!</h3>
        <p>
          이제 흐름에 맞춰<br />
          자소서·기업분석·지원 일정을 함께 정리해드릴게요.
        </p>
        <div className="summary">
          <div className="row"><b>준비</b><span>{purposeLabel}</span></div>
          <div className="row"><b>경력</b><span>{careerLabel}</span></div>
          <div className="row"><b>직무</b><span>{positionLabel}</span></div>
        </div>
        <button type="button" className="btn primary lg" style={{ width: "100%" }} onClick={onDismiss}>
          대시보드로 이동
        </button>
      </div>
    </div>
  );
}
