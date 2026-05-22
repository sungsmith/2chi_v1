"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeywordChipList } from "./keyword-chip-list";
import { PostingCtaModal } from "@/components/cover-letters/posting-cta-modal";
import { fetchAnalysisByCompany } from "@/lib/api/company-analysis";
import { createApplication } from "@/lib/api/application";
import type { JobPosting } from "@/lib/types/posting";

type Props = {
  posting: JobPosting;
  applicationId: number | null;     // null 이면 미지원 상태
  onEdit: () => void;
  onDelete: () => void;
  onApplied: (postingId: number, applicationId: number) => void;
};

export function PostingCard({ posting, applicationId, onEdit, onDelete, onApplied }: Props) {
  const [ctaOpen, setCtaOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState<string | undefined>();
  const router = useRouter();

  async function handleAnalysisClick() {
    try {
      const ref = await fetchAnalysisByCompany(posting.company);
      if (ref.id !== null) {
        router.push(`/company/analysis/${ref.id}`);
      } else {
        router.push(`/company/analysis/new?company=${encodeURIComponent(posting.company)}`);
      }
    } catch {
      router.push(`/company/analysis/new?company=${encodeURIComponent(posting.company)}`);
    }
  }

  async function handleApplyClick() {
    if (applicationId !== null) {
      router.push("/applications");
      return;
    }
    setAppLoading(true);
    setAppError(undefined);
    try {
      const created = await createApplication({ postingId: posting.id });
      onApplied(posting.id, created.id);
    } catch (e) {
      setAppError(e instanceof Error ? e.message : "지원 등록에 실패했어요.");
    } finally {
      setAppLoading(false);
    }
  }

  const applied = applicationId !== null;

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
        {appError && (
          <div role="alert" style={{ marginTop: 8, fontSize: 12, color: "var(--color-semantic-error)" }}>
            {appError}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          className={applied ? "btn" : "btn ghost"}
          onClick={handleApplyClick}
          disabled={appLoading}
          style={{ fontSize: 13 }}
        >
          {applied ? "✓ 지원 중" : "✅ 지원함"}
        </button>
        <button className="btn ghost" onClick={() => setCtaOpen(true)} style={{ fontSize: 13 }}>
          ✍ 자소서 작성
        </button>
        <button className="btn ghost" onClick={handleAnalysisClick} type="button" style={{ fontSize: 13 }}>
          🏢 기업분석
        </button>
        <button className="btn ghost" onClick={onEdit}>편집</button>
        <button className="btn ghost" onClick={onDelete} style={{ color: "var(--color-semantic-error)" }}>
          삭제
        </button>
      </div>
      {ctaOpen && (
        <PostingCtaModal
          postingId={posting.id}
          postingCompany={posting.company}
          onClose={() => setCtaOpen(false)}
        />
      )}
    </article>
  );
}
