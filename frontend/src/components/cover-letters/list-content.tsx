"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Ico from "@/components/ui/icons";
import { fetchVariantsGrouped } from "@/lib/api/cover-letter";
import { type VariantListGroup } from "@/lib/types/cover-letter";
import { CL_FILTERS } from "@/lib/mock/cover-letters";
import { ClCard } from "./cl-card";

export function CoverLetterListContent() {
  const router = useRouter();
  const [groups, setGroups] = useState<VariantListGroup[] | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    fetchVariantsGrouped()
      .then(setGroups)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "자소서를 불러오지 못했어요.")
      );
  }, []);

  return (
    <>
      <div className="cl-list-head">
        <div>
          <h1>자소서</h1>
          <div className="sub">
            공고별 자소서를 한곳에서 작성·관리하세요.
          </div>
        </div>
        <button
          className="btn primary"
          type="button"
          onClick={() => router.push("/company/postings")}
        >
          <Ico.Plus size={14} /> 새 자소서 작성
        </button>
      </div>

      {/* Filter strip — visual only in this PR; no filtering logic yet TODO Task 8 */}
      <div className="cl-toolbar">
        <label className="search">
          <span className="ico"><Ico.Search size={14} /></span>
          <input placeholder="회사명 · 자소서 제목으로 검색&#8230;" />
        </label>
        <div className="cl-filter-chips">
          {CL_FILTERS.map((f) => (
            <button key={f.id} className={f.id === "all" ? "active" : ""} type="button">
              {f.nm}
              <span className="n">{f.n}</span>
            </button>
          ))}
        </div>
        <div className="cl-sort">
          <div className="seg">
            <button className="active" type="button">최근순</button>
            <button type="button">마감순</button>
            <button type="button">매칭률</button>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" style={{
          marginBottom: 16,
          padding: "10px 14px",
          background: "var(--color-semantic-error-bg)",
          color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)",
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* 자소서 목록 — 공고별 변형본(5.7 variant API). 마스터 자소서는 v1 폐기. */}
      <div className="cl-section-title">
        자소서{" "}
        <span className="count">
          {groups === null ? "…" : groups.reduce((acc, g) => acc + g.variants.length, 0)}
        </span>
      </div>

      {groups === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : groups.length === 0 ? (
        <div className="cl-grid">
          <p style={{ color: "var(--color-text-secondary)", gridColumn: "span 3" }}>
            아직 작성한 자소서가 없어요. 공고에서 자소서 작성을 시작해보세요.
          </p>
        </div>
      ) : (
        <div className="cl-grid">
          {groups.flatMap((g) =>
            g.variants.map((v) => (
              <ClCard
                key={v.id}
                item={{
                  id: String(v.id),
                  title: `${g.posting.company} · ${v.itemType}`,
                  co: g.posting.company,
                  pos: g.posting.title ?? "",
                  match: 0,
                  updated: v.updatedAt.slice(0, 10),
                  dday: null,
                  status: v.status === "COMPLETED" ? "ready" : "draft",
                }}
                onOpen={() => router.push(`/cover-letters/variants/${v.id}`)}
              />
            ))
          )}
        </div>
      )}
    </>
  );
}
