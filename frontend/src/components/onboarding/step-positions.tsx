"use client";

import type { ReactNode } from "react";
import { TargetJob } from "@/lib/enums/target-job";
import { Code, Server, Cloud, Gear, Layout, Check } from "./icons";

type Item = { job: TargetJob; name: string; desc: string; icon: ReactNode; tone: number };

const ITEMS: Item[] = [
  { job: "FRONTEND",    name: "Frontend",      desc: "웹·앱 화면 구현",                       icon: <Code />,   tone: 1 },
  { job: "BACKEND",     name: "Backend",       desc: "서버·API·DB",                          icon: <Server />, tone: 1 },
  { job: "INFRA_CLOUD", name: "Infra / Cloud", desc: "AWS · GCP · K8s",                       icon: <Cloud />,  tone: 3 },
  { job: "INFRA_OPS",   name: "Infra / Ops",   desc: "VMware·NAS·백신·백업·네트워크",         icon: <Gear />,   tone: 3 },
  { job: "UI_UX",       name: "UI / UX",       desc: "제품·서비스 디자인",                     icon: <Layout />, tone: 2 },
];

type Props = { value: Set<TargetJob>; onToggle: (j: TargetJob) => void };

export function StepPositions({ value, onToggle }: Props) {
  return (
    <div className="onb-scene entering">
      <div className="eyebrow">STEP 3 / 4</div>
      <h2>어떤 직무를 준비하고 있나요?</h2>
      <p className="sub">여러 개 선택해도 괜찮아요. 선택한 직무를 기준으로 자소서, 기업분석, 채용공고가 맞춤화돼요.</p>
      <div className="position-grid">
        {ITEMS.map((it) => {
          const selected = value.has(it.job);
          return (
            <button
              key={it.job}
              type="button"
              aria-pressed={selected}
              className={`position-card tone-${it.tone}${selected ? " selected" : ""}`}
              onClick={() => onToggle(it.job)}
            >
              <div className="ico">{it.icon}</div>
              <div>
                <div className="name">{it.name}</div>
                <div className="desc">{it.desc}</div>
              </div>
              <span className="check"><Check size={11} /></span>
            </button>
          );
        })}
      </div>
      <div className="position-foot">
        <span className="badge info dot">선택됨</span>
        <span className="count">{value.size}개 직무</span>
      </div>
    </div>
  );
}
