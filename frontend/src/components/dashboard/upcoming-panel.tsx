"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EventListItem } from "@/lib/types/application";
import { fetchEvents } from "@/lib/api/application";
import { EVENT_TYPE_LABEL, EVENT_TYPE_TOKEN_CLASS } from "@/lib/types/application";
import { toLocalIso } from "@/lib/utils/date";
import { Calendar, ArrowRight } from "@/components/ui/icons";

function dday(eventDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "오늘";
  if (diff > 0) return `D-${diff}`;
  return `D+${-diff}`;
}

export function UpcomingPanel() {
  const [items, setItems] = useState<EventListItem[] | null>(null);

  useEffect(() => {
    const today = toLocalIso(new Date());
    const t7 = new Date();
    t7.setDate(t7.getDate() + 7);
    const to = toLocalIso(t7);
    fetchEvents(today, to)
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="title">
          <span className="ico"><Calendar size={16} /></span>
          다가오는 일정
        </h2>
        <Link href="/applications/calendar" className="more">
          캘린더 보기 <ArrowRight />
        </Link>
      </div>
      <div className="sched-list">
        {items === null ? (
          <div style={{ color: "var(--color-text-secondary)", padding: 12 }}>불러오는 중…</div>
        ) : items.length === 0 ? (
          <div style={{ color: "var(--color-text-secondary)", padding: 12 }}>
            다가오는 일정이 없어요. 일정을 추가해 보세요.
          </div>
        ) : (
          items.slice(0, 5).map((it) => {
            const d = new Date(it.eventDate);
            const month = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
            const day = String(d.getDate());
            const weekday = ["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()];
            const dd = dday(it.eventDate);
            const soon = dd === "오늘" || dd === "D-1";
            return (
              <div key={it.id} className={`sched-row${soon ? " soon" : ""}`}>
                <div className="sched-date">
                  <span className="m">{month}</span>
                  <span className="d">{day}</span>
                  <span className="wd">{weekday}</span>
                </div>
                <div className="sched-info">
                  <div className="co">{it.company}</div>
                  <div className="meta">
                    <span className={EVENT_TYPE_TOKEN_CLASS[it.type]}>{EVENT_TYPE_LABEL[it.type]}</span>
                    <span className="dot" />
                    <span>{it.role}</span>
                  </div>
                </div>
                <div className="sched-time">{it.eventTime ? it.eventTime.slice(0, 5) : ""}</div>
                <div className="sched-dday">{dd}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
