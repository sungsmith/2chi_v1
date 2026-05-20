"use client";

import { Sparkle } from "./icons";

const CAREERS = [
  { value: 0, num: "신입", lbl: "0년" },
  { value: 1, num: "1",   lbl: "년차" },
  { value: 2, num: "2",   lbl: "년차" },
  { value: 3, num: "3",   lbl: "년차" },
  { value: 4, num: "4",   lbl: "년차" },
  { value: 5, num: "5",   lbl: "년차" },
  { value: 6, num: "6",   lbl: "년차" },
  { value: 7, num: "7+",  lbl: "년차 이상" },
];

type Props = { value: number | undefined; onChange: (v: number) => void };

export function StepCareer({ value, onChange }: Props) {
  return (
    <div className="onb-scene entering">
      <div className="eyebrow">STEP 2 / 4</div>
      <h2>경력을 알려주세요</h2>
      <p className="sub">맞춤 자소서 흐름과 추천 공고 범위를 정하는 데 사용돼요. 나중에 언제든 바꿀 수 있어요.</p>
      <div className="career-grid">
        {CAREERS.map((c) => {
          const selected = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={selected}
              className={`career-chip${selected ? " selected" : ""}`}
              onClick={() => onChange(c.value)}
            >
              <div className="num">{c.num}</div>
              <div className="lbl">{c.lbl}</div>
            </button>
          );
        })}
      </div>
      <div className="career-note">
        <Sparkle size={14} />
        <span>경력을 선택하면, 신입 / 주니어 / 시니어에 맞는 자소서 톤이 자동으로 조정돼요.</span>
      </div>
    </div>
  );
}
