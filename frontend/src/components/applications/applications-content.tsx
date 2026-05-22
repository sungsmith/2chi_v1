"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationsHeader } from "./applications-header";
import { ApplicationFilters } from "./application-filters";
import { ApplicationsTable } from "./applications-table";
import { ApplicationEditModal } from "./application-edit-modal";
import { fetchApplications } from "@/lib/api/application";
import type { ApplicationSummary, Stage, Result } from "@/lib/types/application";

type Props = { stage?: string; result?: string; sort?: string };

export function ApplicationsContent({ stage, result, sort }: Props) {
  const router = useRouter();
  const [apps, setApps] = useState<ApplicationSummary[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    fetchApplications({
      stage: stage as Stage | undefined,
      result: result as Result | undefined,
    })
      .then((list) => {
        const sortedList = [...list];
        if (sort === "deadline") {
          sortedList.sort((a, b) => {
            const ad = a.nextEvent?.eventDate ?? "9999-12-31";
            const bd = b.nextEvent?.eventDate ?? "9999-12-31";
            return ad.localeCompare(bd);
          });
        }
        setApps(sortedList);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "지원 목록을 불러오지 못했어요."));
  }, [stage, result, sort, refreshTick]);

  function updateUrl(next: Partial<{ stage?: Stage; result?: Result; sort?: string }>) {
    const qs = new URLSearchParams();
    const finalStage = "stage" in next ? next.stage : stage;
    const finalResult = "result" in next ? next.result : result;
    const finalSort = "sort" in next ? next.sort : sort;
    if (finalStage) qs.set("stage", finalStage);
    if (finalResult) qs.set("result", finalResult);
    if (finalSort) qs.set("sort", finalSort);
    router.replace(qs.toString() ? `/applications?${qs}` : "/applications");
  }

  return (
    <section style={{ padding: 32 }}>
      <ApplicationsHeader />
      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}
      {apps !== null && (
        <ApplicationFilters
          apps={apps}
          stage={stage as Stage | undefined}
          result={result as Result | undefined}
          sort={sort}
          onStageChange={(s) => updateUrl({ stage: s })}
          onResultChange={(r) => updateUrl({ result: r })}
          onSortChange={(s) => updateUrl({ sort: s })}
        />
      )}
      {apps === null ? (
        <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
      ) : (
        <ApplicationsTable apps={apps} onRowClick={setEditingId} />
      )}
      {editingId !== null && (
        <ApplicationEditModal
          applicationId={editingId}
          onClose={() => setEditingId(null)}
          onChanged={() => setRefreshTick((t) => t + 1)}
        />
      )}
    </section>
  );
}
