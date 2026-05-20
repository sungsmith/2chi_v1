"use client";

import type { ReactNode } from "react";
import { Target } from "@/lib/enums/target";
import { Briefcase, Move, Check } from "./icons";

type Item = { target: Target; title: string; desc: string; icon: ReactNode; tone: string };

const ITEMS: Item[] = [
  { target: "EMPLOYMENT", title: "취업 준비 중", desc: "첫 직장을 차분히 찾고 있어요", icon: <Briefcase />, tone: "primary" },
  { target: "JOB_CHANGE", title: "이직 준비 중", desc: "더 잘 맞는 곳으로 옮기려 해요", icon: <Move />,      tone: "mint" },
];

type Props = { value: Target | undefined; onChange: (v: Target) => void };

export function StepPurpose({ value, onChange }: Props) {
  return (
    <div className="onb-scene entering">
      <div className="eyebrow">STEP 1 / 4</div>
      <h2>지금 어떤 준비를 하고 있나요?</h2>
      <p className="sub">처음이라도 괜찮아요. 이취가 준비 흐름을 같이 정리해드릴게요.</p>
      <div className="onb-choice-grid cols-2">
        {ITEMS.map((it) => {
          const selected = value === it.target;
          return (
            <button
              key={it.target}
              type="button"
              aria-pressed={selected}
              className={`onb-choice${selected ? " selected" : ""}`}
              onClick={() => onChange(it.target)}
            >
              <div className="icon-wrap" data-tone={it.tone}>{it.icon}</div>
              <div>
                <div className="title">{it.title}</div>
                <div className="desc">{it.desc}</div>
              </div>
              <span className="check"><Check size={12} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
