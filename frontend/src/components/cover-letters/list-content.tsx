"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchVariantsGrouped } from "@/lib/api/cover-letter";
import { ITEM_TYPE_LABELS, type VariantListGroup } from "@/lib/types/cover-letter";

export function CoverLetterListContent() {
  const [groups, setGroups] = useState<VariantListGroup[] | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    fetchVariantsGrouped()
      .then(setGroups)
      .catch((e) => setError(e instanceof Error ? e.message : "자소서를 불러오지 못했어요."));
  }, []);

  return (
    <section style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>자소서</h2>
        <div style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
          공고 페이지에서 “✍ 자소서 작성” 으로 시작하세요.
        </div>
      </div>

      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}

      {groups === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)" }}>
          아직 작성한 자소서가 없어요.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 24 }}>
          {groups.map((g) => (
            <div key={g.posting.id ?? "none"}>
              <div style={{ marginBottom: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{g.posting.company}</h3>
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{g.posting.title}</span>
              </div>
              <div style={{
                background: "var(--color-surface-default)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}>
                {g.variants.map((v, i) => (
                  <Link key={v.id}
                        href={`/cover-letters/variants/${v.id}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)",
                          textDecoration: "none",
                          color: "var(--color-text-primary)",
                          fontSize: 14,
                        }}>
                    <span style={{ fontWeight: 500 }}>
                      {ITEM_TYPE_LABELS[v.itemType]}
                      <span style={{
                        marginLeft: 8, fontSize: 11, padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: v.status === "COMPLETED"
                          ? "var(--color-semantic-success-bg)"
                          : "var(--color-semantic-warning-bg)",
                        color: v.status === "COMPLETED"
                          ? "var(--color-semantic-success)"
                          : "var(--color-semantic-warning)",
                      }}>{v.status === "COMPLETED" ? "⭐ 완료" : "📝 임시"}</span>
                    </span>
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {v.charCount}/{v.charLimit}자 · {v.updatedAt.slice(0, 10)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
