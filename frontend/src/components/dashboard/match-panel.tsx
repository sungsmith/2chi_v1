import { Target } from "@/components/ui/icons";
import { MascotCloud } from "@/components/ui/mascot-cloud";

// 매칭 분석은 매칭 알고리즘(v2)에서 제공 예정 — 현재는 준비 중 플레이스홀더.
export function MatchPanel() {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="title lav">
          <span className="ico">
            <Target size={16} />
          </span>
          매칭 분석
        </h2>
      </div>
      <div className="panel-soon">
        <MascotCloud size="md" expression="think" />
        <p className="soon-title">매칭 분석을 준비하고 있어요</p>
        <p className="soon-sub">
          내 이력과 채용공고를 비교해 부족 역량을 짚어드릴게요. 곧 만나요.
        </p>
        <span className="badge lav dot">v2 준비 중</span>
      </div>
    </section>
  );
}
