import type { KpiInProgressData } from "@/lib/mock/dashboard";
import { Briefcase } from "@/components/ui/icons";

type Props = { data: KpiInProgressData };

export function KpiInProgress({ data }: Props) {
  return (
    <article className="kpi tone-lav">
      <div className="kpi-head">
        <span className="lbl">진행 중인 지원</span>
        <span className="ico">
          <Briefcase size={16} />
        </span>
      </div>
      <div className="kpi-value">
        <span className="num">{data.total}</span>
        <span className="unit">{data.totalUnit}</span>
      </div>
      <div className="kpi-foot">
        <div className="stage-row">
          {data.stages.map((s) => (
            <span key={s.cls} className={`stage ${s.cls}`}>
              {s.label} <span className="n">{s.n}</span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
