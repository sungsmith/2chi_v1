"use client";

import Link from "next/link";
import type { ApplicationSummary } from "@/lib/types/application";
import { STAGE_LABEL, RESULT_LABEL, EVENT_TYPE_TOKEN_CLASS, STAGE_TO_EVENT_TYPE } from "@/lib/types/application";

type Props = {
  apps: ApplicationSummary[];
  onRowClick: (id: number) => void;
};

function formatDday(eventDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "오늘";
  if (diff > 0) return `D-${diff}`;
  return `D+${-diff}`;
}

function formatUpdated(updatedAt: string): string {
  const diff = Date.now() - new Date(updatedAt).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 전`;
}

export function ApplicationsTable({ apps, onRowClick }: Props) {
  if (apps.length === 0) {
    return (
      <div style={{
        padding: 32, textAlign: "center", color: "var(--color-text-secondary)",
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-lg)",
      }}>
        <p style={{ marginBottom: 8 }}>아직 지원한 공고가 없어요.</p>
        <p style={{ marginBottom: 16, fontSize: 13 }}>공고 카드에서 ✅지원함 을 눌러주세요.</p>
        <Link href="/company/postings" className="btn">공고 보기</Link>
      </div>
    );
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ textAlign: "left", color: "var(--color-text-secondary)", fontSize: 11 }}>
          <th style={{ padding: "8px 12px" }}>회사</th>
          <th style={{ padding: "8px 12px" }}>직무</th>
          <th style={{ padding: "8px 12px" }}>전형</th>
          <th style={{ padding: "8px 12px" }}>다음 일정</th>
          <th style={{ padding: "8px 12px" }}>결과</th>
          <th style={{ padding: "8px 12px" }}>자소서</th>
          <th style={{ padding: "8px 12px" }}>업데이트</th>
        </tr>
      </thead>
      <tbody>
        {apps.map((a) => {
          const eventTypeClass = EVENT_TYPE_TOKEN_CLASS[STAGE_TO_EVENT_TYPE[a.currentStage]];
          return (
            <tr
              key={a.id}
              onClick={() => onRowClick(a.id)}
              style={{ cursor: "pointer", borderBottom: "1px solid var(--color-border-default)" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") onRowClick(a.id); }}
            >
              <td style={{ padding: "10px 12px", fontWeight: 600 }}>{a.company}</td>
              <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)" }}>{a.role}</td>
              <td style={{ padding: "10px 12px" }}>
                <span className={eventTypeClass}>{STAGE_LABEL[a.currentStage]}</span>
              </td>
              <td style={{ padding: "10px 12px" }}>
                {a.nextEvent ? (
                  <span>
                    {a.nextEvent.eventDate}
                    {a.nextEvent.eventTime ? ` ${a.nextEvent.eventTime.slice(0, 5)}` : ""}
                    {" "}<small style={{ color: "var(--color-text-muted)" }}>{formatDday(a.nextEvent.eventDate)}</small>
                  </span>
                ) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
              </td>
              <td style={{ padding: "10px 12px" }}>
                <span style={{ fontSize: 12 }}>{RESULT_LABEL[a.currentResult]}</span>
              </td>
              <td style={{ padding: "10px 12px" }}>
                {a.variantsCount > 0 ? (
                  <Link
                    href={`/cover-letters?postingId=${a.postingId}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: 12, color: "var(--color-text-brand)", textDecoration: "underline" }}
                  >{a.variantsCount}건</Link>
                ) : <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>—</span>}
              </td>
              <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", fontSize: 11 }}>{formatUpdated(a.updatedAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
