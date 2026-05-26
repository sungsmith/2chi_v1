"use client";

import type { Target } from "@/lib/enums/target";
import type { TargetJob } from "@/lib/enums/target-job";
import { Sparkle, Edit } from "./icons";
import { Calendar } from "@/components/ui/icons";

type Props = {
  target: Target | undefined;
  careerYear: number | undefined;
  targetJobs: Set<TargetJob>;
};

export function StepRecap({ target: _target, careerYear: _careerYear, targetJobs: _targetJobs }: Props) {
  return (
    <div className="onb-scene entering">
      <div className="eyebrow">STEP 4 / 4</div>
      <h2>내 경험을 한 번 정리하면,</h2>
      <p className="sub">모든 취업 준비가 조금 더 가벼워져요. 알려주신 정보로 이런 흐름이 자동으로 연결돼요.</p>
      <div className="position-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
        <div className="position-card tone-1">
          <span className="ico"><Edit size={20} /></span>
          <span><span className="name">내 경험 정리</span><span className="desc">PRAR로 차곡차곡</span></span>
          <span />
        </div>
        <div className="position-card tone-2">
          <span className="ico"><Sparkle size={20} /></span>
          <span><span className="name">자소서 초안 생성</span><span className="desc">마스터 자소서 한 벌</span></span>
          <span />
        </div>
        <div className="position-card tone-3">
          <span className="ico"><Edit size={20} /></span>
          <span><span className="name">공고별 맞춤 수정</span><span className="desc">키워드별 변형본</span></span>
          <span />
        </div>
        <div className="position-card tone-4">
          <span className="ico"><Calendar size={20} /></span>
          <span><span className="name">지원 일정 관리</span><span className="desc">서류 → 면접까지</span></span>
          <span />
        </div>
      </div>
    </div>
  );
}
