"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PostingCard } from "./posting-card";
import { PostingEditModal } from "./posting-edit-modal";
import { fetchPostings, patchPosting, deletePosting } from "@/lib/api/posting";
import { fetchApplications } from "@/lib/api/application";
import type { JobPosting, JobPostingPatchRequest } from "@/lib/types/posting";

const Ico = {
  Plus: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Search: ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
};

export function PostingsContent() {
  const [postings, setPostings] = useState<JobPosting[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const [appMap, setAppMap] = useState<Record<number, number>>({});
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([fetchPostings(), fetchApplications()])
      .then(([ps, apps]) => {
        setPostings(ps);
        const m: Record<number, number> = {};
        for (const a of apps) m[a.postingId] = a.id;
        setAppMap(m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "공고를 불러오지 못했어요."));
  }, []);

  async function handlePatch(id: number, patch: JobPostingPatchRequest) {
    try {
      const updated = await patchPosting(id, patch);
      setPostings((prev) => prev ? prev.map((p) => p.id === id ? updated : p) : prev);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "공고 저장에 실패했어요.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deletePosting(id);
      setPostings((prev) => prev ? prev.filter((p) => p.id !== id) : prev);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "공고 삭제에 실패했어요.");
    }
  }

  const now = new Date();

  function isClosed(p: JobPosting) {
    if (!p.deadline) return false;
    return new Date(p.deadline) < now;
  }

  const allCount = postings?.length ?? 0;
  const activeCount = postings?.filter((p) => !isClosed(p)).length ?? 0;
  const closedCount = postings?.filter(isClosed).length ?? 0;

  const filtered = (postings ?? []).filter((p) => {
    if (filter === "active" && isClosed(p)) return false;
    if (filter === "closed" && !isClosed(p)) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.company.toLowerCase().includes(q) || p.title.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <section className="co-head">
        <div>
          <h1>채용공고</h1>
          <div className="sub">등록한 공고는 자소서 작성 · 일정 관리 · 기업분석에 자동으로 연결돼요.</div>
        </div>
        <Link href="/company/postings/new" className="btn primary">
          <Ico.Plus size={14} /> 공고 등록
        </Link>
      </section>

      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}

      <div className="posting-toolbar">
        <label className="search">
          <span className="ico"><Ico.Search size={14} /></span>
          <input
            placeholder="회사명 · 직무로 검색…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="채용공고 검색"
          />
        </label>
        <div className="filter-chips">
          <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            전체 <span className="n">{allCount}</span>
          </button>
          <button type="button" className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>
            진행중 <span className="n">{activeCount}</span>
          </button>
          <button type="button" className={filter === "closed" ? "active" : ""} onClick={() => setFilter("closed")}>
            마감 <span className="n">{closedCount}</span>
          </button>
        </div>
      </div>

      {postings === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 20, color: "var(--color-text-secondary)", textAlign: "center" }}>
          아직 등록한 공고가 없어요. 위에서 첫 공고를 등록해보세요.
        </div>
      ) : (
        <div className="posting-table">
          <div className="posting-row head">
            <div>공고</div>
            <div>출처</div>
            <div>매칭률</div>
            <div>D-day</div>
            <div>등록</div>
            <div />
          </div>
          {filtered.map((p) => (
            <PostingCard
              key={p.id}
              posting={p}
              applicationId={appMap[p.id] ?? null}
              onEdit={() => setEditing(p)}
              onDelete={() => handleDelete(p.id)}
              onApplied={(postingId, applicationId) =>
                setAppMap((prev) => ({ ...prev, [postingId]: applicationId }))
              }
            />
          ))}
        </div>
      )}

      {editing && (
        <PostingEditModal
          posting={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => handlePatch(editing.id, patch)}
          onDelete={() => handleDelete(editing.id)}
        />
      )}
    </>
  );
}
