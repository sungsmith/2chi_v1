"use client";

import { Target, ArrowRight } from "@/components/ui/icons";
import type { MatchRing, Gap } from "@/lib/mock/dashboard";

type Props = {
  ring: MatchRing;
  gaps: Gap[];
};

export function MatchPanel({ ring, gaps }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="title lav">
          <span className="ico">
            <Target size={16} />
          </span>
          매칭 분석
        </h2>
        <a className="more" href="#">
          자세히 <ArrowRight />
        </a>
      </div>
      <div className="match-top">
        <div className="match-ring" style={{ ["--p" as string]: ring.percent } as React.CSSProperties}>
          <span>
            <span className="v">{ring.percent}%</span>
            <span className="lbl">매칭률</span>
          </span>
        </div>
        <div className="meta">
          <span className="k">{ring.position}</span>
          <span className="t">{ring.metricLabel}</span>
          <span className="sub">{ring.description}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="badge lav dot">부족 역량 TOP 3</span>
      </div>
      <div className="gap-list">
        {gaps.map((g, i) => (
          <div key={i} className="gap-item">
            <span className="rank">{i + 1}</span>
            <div>
              <span className="nm">{g.name}</span>
              <span className="sub">{g.sub}</span>
            </div>
            <span className="hit">+{g.hit}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
