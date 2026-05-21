"use client";

import { useEffect, useState } from "react";
import { PostingTabs, type PostingTab } from "./posting-tabs";
import { PostingUrlForm } from "./posting-url-form";
import { PostingManualForm } from "./posting-manual-form";
import { PostingCard } from "./posting-card";
import { PostingEditModal } from "./posting-edit-modal";
import { fetchPostings, createPosting, patchPosting, deletePosting } from "@/lib/api/posting";
import type { JobPosting, JobPostingCreateRequest, JobPostingPatchRequest } from "@/lib/types/posting";

export function PostingsContent() {
  const [tab, setTab] = useState<PostingTab>("url");
  const [postings, setPostings] = useState<JobPosting[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [parseFailedNotice, setParseFailedNotice] = useState<string | undefined>();
  const [parseFailedUrl, setParseFailedUrl] = useState<string | undefined>();
  const [editing, setEditing] = useState<JobPosting | null>(null);

  useEffect(() => {
    fetchPostings()
      .then(setPostings)
      .catch((e) => setError(e instanceof Error ? e.message : "공고를 불러오지 못했어요."));
  }, []);

  async function handleCreate(req: JobPostingCreateRequest) {
    try {
      const created = await createPosting(req);
      setPostings((prev) => prev ? [created, ...prev] : [created]);
      setParseFailedNotice(undefined);
      setParseFailedUrl(undefined);
      setTab("url");
    } catch (e) {
      setError(e instanceof Error ? e.message : "공고 저장에 실패했어요.");
    }
  }

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

  function handleParseFailed(reason: string, url: string) {
    setParseFailedNotice(reason);
    setParseFailedUrl(url);
    setTab("manual");
  }

  return (
    <section style={{ padding: 32 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>+ 채용공고 등록</h2>
      <div style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 20 }}>
        URL 을 넣으면 자동으로 채워드려요. 직접 입력하셔도 돼요.
      </div>

      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}
      {parseFailedNotice && (
        <div role="status" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-warning-bg)", color: "var(--color-semantic-warning)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{parseFailedNotice}</div>
      )}

      <PostingTabs active={tab} onChange={setTab} />

      <div style={{
        padding: 20,
        background: "var(--color-surface-default)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-lg)",
        marginBottom: 32,
      }}>
        {tab === "url" && (
          <PostingUrlForm onSubmit={handleCreate} onParseFailed={handleParseFailed} />
        )}
        {tab === "manual" && (
          <PostingManualForm
            initialSourceUrl={parseFailedUrl}
            onSubmit={handleCreate}
          />
        )}
        {tab === "search" && null}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
        내가 등록한 공고 ({postings?.length ?? 0}건)
      </h3>
      {postings === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : postings.length === 0 ? (
        <div style={{ padding: 20, color: "var(--color-text-secondary)", textAlign: "center" }}>
          아직 등록한 공고가 없어요. 위에서 첫 공고를 등록해보세요.
        </div>
      ) : (
        postings.map((p) => (
          <PostingCard
            key={p.id} posting={p}
            onEdit={() => setEditing(p)}
            onDelete={() => handleDelete(p.id)}
          />
        ))
      )}

      {editing && (
        <PostingEditModal
          posting={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => handlePatch(editing.id, patch)}
          onDelete={() => handleDelete(editing.id)}
        />
      )}
    </section>
  );
}
