"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchVariantsGrouped } from "@/lib/api/cover-letter";
import { type VariantListGroup } from "@/lib/types/cover-letter";
import { MASTERS_MOCK, CL_FILTERS } from "@/lib/mock/cover-letters";
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
            마스터 자소서 한 벌을 만들어두면, 회사별 변형본은 한 번에 만들어드려요.
          </div>
        </div>
      </div>

      {/* Filter strip — visual only in this PR; no filtering logic yet TODO Task 8 */}
      <div className="cl-toolbar">
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

      {/* 마스터 그룹 — disabled (준비중). master CRUD 부활은 별도 PR */}
      <div className="cl-section-title">
        마스터 자소서 <span className="count">{MASTERS_MOCK.length}</span>
      </div>
      <div className="cl-grid">
        {MASTERS_MOCK.map((m) => (
          <ClCard key={m.id} item={m} master disabled />
        ))}
      </div>

      {/* 변형본 그룹 — 기존 5.7 variant API 데이터 */}
      <div className="cl-section-title">
        회사별 변형본{" "}
        <span className="count">
          {groups === null ? "…" : groups.reduce((acc, g) => acc + g.variants.length, 0)}
        </span>
      </div>

      {groups === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : groups.length === 0 ? (
        <div className="cl-grid">
          <p style={{ color: "var(--color-text-secondary)", gridColumn: "span 3" }}>
            아직 작성한 자소서가 없어요.
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
