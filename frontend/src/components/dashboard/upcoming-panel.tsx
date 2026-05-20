import type { ScheduleItem } from "@/lib/mock/dashboard";
import { Calendar, ArrowRight } from "./icons";

type Props = { items: ScheduleItem[] };

export function UpcomingPanel({ items }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div className="title">
          <span className="ico">
            <Calendar size={16} />
          </span>
          다가오는 일정
        </div>
        <span className="more" aria-disabled="true" title="준비중">
          캘린더 보기 <ArrowRight />
        </span>
      </div>
      <div className="sched-list">
        {items.map((s, i) => (
          <div key={i} className={`sched-row${s.soon ? " soon" : ""}`}>
            <div className="sched-date">
              <span className="m">{s.month}</span>
              <span className="d">{s.day}</span>
              <span className="wd">{s.weekday}</span>
            </div>
            <div className="sched-info">
              <div className="co">{s.company}</div>
              <div className="meta">
                <span className={`stage ${s.stageCls}`}>{s.stage}</span>
                <span className="dot" />
                <span>{s.role}</span>
              </div>
            </div>
            <div className="sched-time">{s.time}</div>
            <div className="sched-dday">{s.dday}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
