"use client";

import { useState } from "react";
import type { HistoryEntry } from "@/lib/mock/applications";
import { HistoryRow } from "./history-row";
import * as Icons from "@/components/ui/icons";

const Search = Icons.Search as React.ComponentType<{ size?: number }>;
const Download = Icons.Download as React.ComponentType<{ size?: number }>;

// Day grouping helper
function groupByDay(entries: HistoryEntry[]) {
  // For mock data: group into fixed day labels matching the mock
  // In production this would parse entry dates
  const day1 = entries.slice(0, 3);
  const day2 = entries.slice(3, 5);
  const day3 = entries.slice(5);
  return [
    { label: "2026.05.12 (수) · 오늘", count: day1.length, rows: day1 },
    { label: "2026.05.11 (화)", count: day2.length, rows: day2 },
    { label: "2026.05.09 (일)", count: day3.length, rows: day3 },
  ].filter((g) => g.rows.length > 0);
}

type Props = {
  entries: HistoryEntry[];
};

export function HistoryView({ entries }: Props) {
  const [sort, setSort] = useState("recent");

  const isEmpty = entries.length === 0;
  const groups = isEmpty ? [] : groupByDay(entries);

  return (
    <>
      <section className="ap-head">
        <div>
          <h1>히스토리</h1>
          <div className="sub">지원 일정 · 전형 단계 · 결과의 모든 변경 로그를 시간 역순으로 보여드려요.</div>
        </div>
        <div className="actions">
          <button className="btn ghost sm"><Search size={12} /> 검색</button>
          <button className="btn secondary sm"><Download size={12} /> 내보내기</button>
        </div>
      </section>

      <div className="kan-toolbar">
        <div className="filter-chips">
          <button className="active">전체 <span className="n">142</span></button>
          <button>전형 변경 <span className="n">38</span></button>
          <button>자소서 <span className="n">52</span></button>
          <button>알림 <span className="n">29</span></button>
          <button>지원 등록 <span className="n">23</span></button>
        </div>
        <div className="sort">
          <span className="lbl">정렬</span>
          <div className="seg">
            <button className={sort === "recent" ? "active" : ""} onClick={() => setSort("recent")}>시간 역순</button>
            <button className={sort === "co" ? "active" : ""} onClick={() => setSort("co")}>회사별</button>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <section className="history">
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
            아직 활동 기록이 없어요. 지원서를 등록하면 히스토리가 쌓여요.
          </div>
        </section>
      ) : (
        <section className="history">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="history-day">
                {group.label}
                <span className="count">{group.count}</span>
              </div>
              {group.rows.map((entry) => (
                <HistoryRow
                  key={entry.id}
                  time={entry.time}
                  icon={entry.icon}
                  iconTone={entry.iconTone}
                  msg={entry.msg}
                  actor={entry.actor}
                  msgParts={entry.msgParts}
                />
              ))}
            </div>
          ))}

          <div className="history-pager">
            <span className="meta">전체 <b>142</b>건 · <b>1–30</b> 보기</span>
            <nav className="pg">
              <a className="disabled" aria-disabled="true">‹</a>
              <a className="active">1</a>
              <a>2</a>
              <a>3</a>
              <a>4</a>
              <span className="ellipsis">…</span>
              <a>5</a>
              <a>›</a>
            </nav>
          </div>
        </section>
      )}
    </>
  );
}
