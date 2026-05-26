"use client";

import Link from "next/link";
import type { JobPosting } from "@/lib/types/posting";

type Props = {
  posting: JobPosting;
  applicationId: number | null;
  onEdit: () => void;
  onDelete: () => void;
  onApplied: (postingId: number, applicationId: number) => void;
};

function computeDday(deadline: string | null): { label: string; soon: boolean; closed: boolean } {
  if (!deadline) return { label: "—", soon: false, closed: false };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: "마감", soon: false, closed: true };
  if (diff === 0) return { label: "D-day", soon: true, closed: false };
  return { label: `D-${diff}`, soon: diff <= 3, closed: false };
}

function formatAdded(createdAt: string): string {
  const now = new Date();
  const d = new Date(createdAt);
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return "오늘";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

function srcLabel(source: string): string {
  if (source === "SARAMIN") return "사람인";
  if (source === "URL") return "URL";
  return "직접 작성";
}

function srcClass(source: string): string {
  if (source === "SARAMIN") return "saramin";
  if (source === "URL") return "url";
  return "manual";
}

export function PostingCard({ posting, onEdit }: Props) {
  const { label: ddayLabel, soon, closed } = computeDday(posting.deadline);
  const added = formatAdded(posting.createdAt);

  return (
    <Link
      href={`/company/postings/${posting.id}`}
      className={`posting-row${closed ? " closed" : ""}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="body">
        <div className="nm">{posting.title}</div>
        <div className="meta">
          <span className="co">{posting.company}</span>
          <span className="sep" />
          <span>{posting.jobRole ?? "직무 미입력"}</span>
        </div>
      </div>
      <div>
        <span className={`src-pill ${srcClass(posting.source)}`}>
          {srcLabel(posting.source)}
        </span>
      </div>
      <div>
        {/* match% 필드가 JobPosting 타입에 없어 생략 */}
        <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>—</span>
      </div>
      <div>
        <span className={`dday-pill${closed ? " closed" : soon ? "" : " cool"}`}>{ddayLabel}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>{added}</div>
      <button
        className="more"
        aria-label="더보기"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
      </button>
    </Link>
  );
}
