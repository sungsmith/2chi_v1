import { Check } from "./icons";

const STEPS = [
  { num: 1, label: "준비 단계" },
  { num: 2, label: "경력 연차" },
  { num: 3, label: "희망 직무" },
  { num: 4, label: "둘러보기" },
];

type Props = { current: 1 | 2 | 3 | 4 };

export function Stepper({ current }: Props) {
  return (
    <div className="onb-stepper">
      {STEPS.map((s, i) => {
        const idx = i + 1;
        const state = idx < current ? "done" : idx === current ? "active" : "";
        return (
          <div key={s.num} className={`onb-step-pill ${state}`}>
            <div className="bar" />
            <div className="meta">
              <span className="num">{idx < current ? <Check size={10} /> : s.num}</span>
              <span>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
