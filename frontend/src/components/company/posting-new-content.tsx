"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostingTabs } from "./posting-tabs";
import { PostingUrlForm } from "./posting-url-form";
import { PostingManualForm } from "./posting-manual-form";
import { createPosting } from "@/lib/api/posting";
import type { JobPostingCreateRequest } from "@/lib/types/posting";
import type { PostingTab } from "./posting-tabs";

export function PostingNewContent() {
  const router = useRouter();
  const [tab, setTab] = useState<PostingTab>("url");
  const [fallbackUrl, setFallbackUrl] = useState<string | undefined>();

  async function handleCreate(req: JobPostingCreateRequest) {
    const posting = await createPosting(req);
    router.push(`/company/postings/${posting.id}`);
  }

  function handleParseFailed(_reason: string, url: string) {
    setFallbackUrl(url);
    setTab("manual");
  }

  return (
    <div className="pst-main">
      <header className="pst-head">
        <h1>채용공고 등록</h1>
        <p className="sub">공고를 한 번 등록해두면 자소서 작성·일정 관리·기업분석에 그대로 연결돼요.</p>
      </header>

      <PostingTabs active={tab} onChange={setTab} />

      {tab === "url" && (
        <PostingUrlForm onSubmit={handleCreate} onParseFailed={handleParseFailed} />
      )}
      {tab === "manual" && (
        <PostingManualForm
          onSubmit={handleCreate}
          initialSourceUrl={fallbackUrl}
        />
      )}
      {tab === "search" && (
        <div className="locked-tab">v2 에서 제공 예정</div>
      )}
    </div>
  );
}
