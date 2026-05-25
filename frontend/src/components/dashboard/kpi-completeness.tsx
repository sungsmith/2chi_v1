import type { KpiCompletenessData } from "@/lib/mock/dashboard";
import { Layers } from "@/components/ui/icons";

type Props = { data: KpiCompletenessData };

export function KpiCompleteness({ data }: Props) {
  return (
    <article className="kpi tone-mint">
      <div className="kpi-head">
        <span className="lbl">내 작성 이력 완성도</span>
        <span className="ico">
          <Layers size={16} />
        </span>
      </div>
      <div className="kpi-value">
        <span className="num">{data.total}</span>
        <span className="unit">%</span>
      </div>
      <div className="kpi-foot">
        {data.parts.map((p) => (
          <div key={p.name} className={`bar-row${p.tone ? ` ${p.tone}` : ""}`}>
            <span className="nm">{p.name}</span>
            <span className="track">
              <span style={{ width: `${p.pct}%` }} />
            </span>
            <span className="pct">{p.pct}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
