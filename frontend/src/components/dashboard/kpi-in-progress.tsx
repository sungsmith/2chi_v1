import type { KpiInProgressData } from "@/lib/mock/dashboard";
import { Briefcase } from "./icons";

type Props = { data: KpiInProgressData };

export function KpiInProgress({ data }: Props) {
  return (
    <article className="kpi tone-lav">
      <span className="kpi-ring" aria-hidden="true" />
      <div className="kpi-head">
        <span className="lbl">진행 중인 지원</span>
        <span className="ico">
          <Briefcase />
        </span>
      </div>
      <div className="kpi-value">
        <span className="num">{data.total}</span>
        <span className="unit">{data.totalUnit}</span>
      </div>
      <div className="kpi-foot">
        <div className="stage-row">
          {data.stages.map((s) => (
            <span key={s.cls} className={`stage ${s.cls} dot`}>
              {s.label} <span className="n">{s.n}</span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
