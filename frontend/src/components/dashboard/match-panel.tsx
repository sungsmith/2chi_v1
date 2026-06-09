"use client";

import { useEffect, useState } from "react";
import { Target } from "@/components/ui/icons";
import { MascotCloud } from "@/components/ui/mascot-cloud";
import { fetchDashboardMatch } from "@/lib/api/match";
import type { DashboardMatch } from "@/lib/types/match";

export function MatchPanel() {
  const [data, setData] = useState<DashboardMatch | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardMatch()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  const head = (
    <div className="panel-head">
      <h2 className="title lav">
        <span className="ico"><Target size={16} /></span>
        매칭 분석
      </h2>
    </div>
  );

  if (!data && !error) {
    return (
      <section className="panel">
        {head}
        <div className="panel-soon"><p className="soon-sub">매칭을 계산하고 있어요…</p></div>
      </section>
    );
  }

  if (error || !data || data.postingCount === 0) {
    return (
      <section className="panel">
        {head}
        <div className="panel-soon">
          <MascotCloud size="md" expression="think" />
          <p className="soon-title">아직 비교할 채용공고가 없어요</p>
          <p className="soon-sub">채용공고를 등록하면 내 이력과 키워드를 비교해 매칭률과 보완하면 좋을 역량을 알려드려요.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      {head}
      <div className="match-top">
        <div className="match-ring" style={{ ["--p" as string]: data.percent } as React.CSSProperties}>
          <span>
            <span className="v">{data.percent}%</span>
            <span className="lbl">매칭률</span>
          </span>
        </div>
        <div className="meta">
          <span className="t">JD 평균 매칭률</span>
          <span className="sub">최근 등록한 채용공고 {data.postingCount}건을 기준으로, 내 이력과 키워드를 비교했어요.</span>
        </div>
      </div>
      {data.gaps.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge lav dot">보완하면 좋은 역량 TOP {data.gaps.length}</span>
          </div>
          <div className="gap-list">
            {data.gaps.map((g, i) => (
              <div key={g.keyword} className="gap-item">
                <span className="rank">{i + 1}</span>
                <div>
                  <span className="nm">{g.keyword}</span>
                  <span className="sub">채용공고 {g.hitCount}곳에서 요구돼요</span>
                </div>
                <span className="hit">{g.hitCount}건</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
