"use client";

import { KeywordChipList } from "./keyword-chip-list";
import type { JobPosting } from "@/lib/types/posting";

type Props = {
  posting: JobPosting;
  onEdit: () => void;
  onDelete: () => void;
};

export function PostingCard({ posting, onEdit, onDelete }: Props) {
  return (
    <article
      style={{
        padding: 16,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 16,
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>
          {posting.company}
        </div>
        <div
          style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, overflow: "hidden",
                   textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
          onClick={onEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") onEdit(); }}
        >
          {posting.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>
          {posting.jobRole ?? "직무 미입력"} · {posting.deadline ? `~${posting.deadline}` : "마감일 미정"}
        </div>
        <KeywordChipList keywords={posting.keywords} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button className="btn ghost" onClick={onEdit}>편집</button>
        <button className="btn ghost" onClick={onDelete} style={{ color: "var(--color-semantic-error)" }}>
          삭제
        </button>
      </div>
    </article>
  );
}
