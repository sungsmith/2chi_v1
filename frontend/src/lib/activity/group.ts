import type { ActivityItem } from "@/lib/types/activity";
import type { HistoryEntry } from "@/lib/mock/applications";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export function toTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// 그룹핑·날짜 라벨은 사용자 브라우저의 로컬 시간 기준 (toTime 과 일관).
// 서버는 occurredAt 을 UTC ISO 로 주고, 표시는 사용자 로컬 일자로 묶는다.
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string, today: Date): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const w = WEEKDAY[d.getDay()];
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  return `${y}.${m}.${day} (${w})${isToday ? " · 오늘" : ""}`;
}

export function toEntry(a: ActivityItem): HistoryEntry {
  const msgParts: NonNullable<HistoryEntry["msgParts"]> = {};
  if (a.subject) msgParts.bold = a.subject;
  if (a.fromLabel) msgParts.stageFrom = a.fromLabel;
  if (a.toLabel) msgParts.stageTo = a.toLabel;
  if (a.suffix) msgParts.suffix = a.suffix;
  const msg = [a.subject, a.fromLabel, a.toLabel, a.suffix].filter(Boolean).join(" ");
  return {
    id: String(a.id),
    time: toTime(a.occurredAt),
    icon: a.icon,
    iconTone: a.tone ?? undefined,
    msg,
    actor: a.actor,
    msgParts,
  };
}

export type DayGroup = { label: string; count: number; rows: HistoryEntry[] };

export function groupByDay(items: ActivityItem[], today: Date): DayGroup[] {
  const order: string[] = [];
  const map = new Map<string, { label: string; rows: HistoryEntry[] }>();
  for (const a of items) {
    const key = dayKey(a.occurredAt);
    if (!map.has(key)) {
      map.set(key, { label: dayLabel(a.occurredAt, today), rows: [] });
      order.push(key);
    }
    map.get(key)!.rows.push(toEntry(a));
  }
  return order.map((k) => {
    const g = map.get(k)!;
    return { label: g.label, count: g.rows.length, rows: g.rows };
  });
}
