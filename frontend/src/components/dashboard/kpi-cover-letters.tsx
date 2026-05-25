import type { KpiCoverLettersData } from "@/lib/mock/dashboard";
import { FileEdit } from "@/components/ui/icons";

type Props = { data: KpiCoverLettersData };

export function KpiCoverLetters({ data }: Props) {
  return (
    <article className="kpi">
      <div className="kpi-head">
        <span className="lbl">자소서 작성 수</span>
        <span className="ico">
          <FileEdit size={16} />
        </span>
      </div>
      <div className="kpi-value">
        <span className="num">{data.total}</span>
        <span className="unit">{data.totalUnit}</span>
      </div>
      <div className="kpi-foot">
        <div className="mini-stats">
          {data.mini.map((m) => (
            <div key={m.k} className="mini">
              <span className="k">{m.k}</span>
              <span className="v">
                {m.v}
                <em>{m.unit}</em>
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
