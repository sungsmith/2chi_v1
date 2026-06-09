"use client";

import { useEffect, useState } from "react";
import { fetchActivities } from "@/lib/api/activity";
import type { ActivityCategory, ActivityListResponse } from "@/lib/types/activity";
import { groupByDay } from "@/lib/activity/group";
import { HistoryRow } from "./history-row";
import * as Icons from "@/components/ui/icons";

const Search = Icons.Search as React.ComponentType<{ size?: number }>;
const Download = Icons.Download as React.ComponentType<{ size?: number }>;

const PAGE_SIZE = 30;

const CHIPS: { key: ActivityCategory | null; label: string; countKey?: ActivityCategory }[] = [
  { key: null, label: "전체" },
  { key: "STAGE", label: "전형 변경", countKey: "STAGE" },
  { key: "COVER_LETTER", label: "자소서", countKey: "COVER_LETTER" },
  { key: "NOTIFICATION", label: "알림", countKey: "NOTIFICATION" },
  { key: "APPLICATION", label: "지원 등록", countKey: "APPLICATION" },
];

export function HistoryView() {
  const [category, setCategory] = useState<ActivityCategory | null>(null);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<ActivityListResponse | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    fetchActivities({ category: category ?? undefined, page, size: PAGE_SIZE })
      .then((res) => { if (!cancelled) { setError(undefined); setData(res); } })
      .catch((e) => { if (!cancelled) { setData(null); setError(e instanceof Error ? e.message : "활동 기록을 불러오지 못했어요."); } });
    return () => { cancelled = true; };
  }, [category, page]);

  const totalAll = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;
  const groups = data ? groupByDay(data.activities, new Date()) : [];
  const isEmpty = data !== null && data.activities.length === 0;

  return (
    <>
      <section className="ap-head">
        <div>
          <h1>히스토리</h1>
          <div className="sub">지원 일정 · 전형 단계 · 결과의 모든 변경 로그를 시간 역순으로 보여드려요.</div>
        </div>
        <div className="actions">
          <button className="btn ghost sm" disabled><Search size={12} /> 검색</button>
          <button className="btn secondary sm" disabled><Download size={12} /> 내보내기</button>
        </div>
      </section>

      <div className="kan-toolbar">
        <div className="filter-chips">
          {CHIPS.map((c) => {
            const n = c.key === null ? totalAll : data?.counts[c.countKey!] ?? 0;
            return (
              <button
                key={c.label}
                className={category === c.key ? "active" : ""}
                type="button"
                onClick={() => { setCategory(c.key); setPage(0); }}
              >
                {c.label} <span className="n">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <section className="history">
          <div role="alert" style={{ padding: "24px", color: "var(--color-semantic-error)" }}>{error}</div>
        </section>
      )}

      {!error && data === null && (
        <section className="history">
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>불러오는 중…</div>
        </section>
      )}

      {!error && isEmpty && (
        <section className="history">
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
            아직 활동 기록이 없어요. 지원서를 등록하면 히스토리가 쌓여요.
          </div>
        </section>
      )}

      {!error && data && !isEmpty && (
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
            <span className="meta">전체 <b>{data.totalCount}</b>건 · <b>{page * PAGE_SIZE + 1}–{page * PAGE_SIZE + data.activities.length}</b> 보기</span>
            <nav className="pg">
              <a className={page === 0 ? "disabled" : ""} aria-disabled={page === 0} onClick={() => page > 0 && setPage(page - 1)}>‹</a>
              <a className="active">{page + 1}</a>
              <a className={!data.hasNext ? "disabled" : ""} aria-disabled={!data.hasNext} onClick={() => data.hasNext && setPage(page + 1)}>›</a>
            </nav>
          </div>
        </section>
      )}
    </>
  );
}
