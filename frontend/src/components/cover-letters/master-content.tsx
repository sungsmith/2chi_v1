"use client";

import { useEffect, useState } from "react";
import { ItemTypeList } from "./item-type-list";
import { MasterEditor } from "./master-editor";
import { OtherMastersList } from "./other-masters-list";
import {
  fetchMasterSummary, fetchMastersByType,
  createMaster, patchMaster, copyMaster, deleteMaster,
} from "@/lib/api/cover-letter";
import {
  type CoverLetterMaster, type CoverLetterMasterSummary,
  type ItemType, type MasterRequest,
  ITEM_TYPE_ORDER,
} from "@/lib/types/cover-letter";

function emptyCounts(): Record<ItemType, number> {
  return Object.fromEntries(ITEM_TYPE_ORDER.map((t) => [t, 0])) as Record<ItemType, number>;
}

export function CoverLetterMasterContent() {
  const [summaries, setSummaries] = useState<CoverLetterMasterSummary[] | null>(null);
  const [activeType, setActiveType] = useState<ItemType>("MOTIVATION");
  const [typeRows, setTypeRows] = useState<CoverLetterMaster[] | null>(null);
  const [editingId, setEditingId] = useState<number | null | "NEW">(null);
  const [error, setError] = useState<string | undefined>();

  async function reloadAll(t: ItemType = activeType) {
    try {
      const [s, r] = await Promise.all([fetchMasterSummary(), fetchMastersByType(t)]);
      setSummaries(s);
      setTypeRows(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "마스터를 불러오지 못했어요.");
    }
  }

  useEffect(() => {
    fetchMasterSummary()
      .then(setSummaries)
      .catch((e) => setError(e instanceof Error ? e.message : "마스터 목록을 불러오지 못했어요."));
  }, []);

  useEffect(() => {
    fetchMastersByType(activeType)
      .then(setTypeRows)
      .catch((e) => setError(e instanceof Error ? e.message : "마스터를 불러오지 못했어요."));
  }, [activeType]);

  const counts: Record<ItemType, number> = emptyCounts();
  if (summaries) {
    for (const s of summaries) counts[s.itemType] = (counts[s.itemType] ?? 0) + 1;
  }

  const selected: CoverLetterMaster | null =
    editingId === "NEW"
      ? null
      : (editingId !== null
          ? (typeRows?.find((r) => r.id === editingId) ?? null)
          : (typeRows?.find((r) => r.isDefault) ?? typeRows?.[0] ?? null));

  const others = typeRows?.filter((r) => r.id !== selected?.id) ?? [];
  const defaultExistsForType = (typeRows ?? []).some((r) => r.isDefault);

  async function handleSave(req: MasterRequest, patchOnly: boolean) {
    try {
      if (patchOnly && selected) {
        await patchMaster(selected.id, {
          title: req.title,
          masterAnswer: req.masterAnswer,
          charLimitHint: req.charLimitHint,
          isDefault: req.isDefault,
        });
      } else {
        const created = await createMaster(req);
        setEditingId(created.id);
      }
      await reloadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    }
  }

  async function handleSetDefault() {
    if (!selected) return;
    try {
      await patchMaster(selected.id, { isDefault: true });
      await reloadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "기본 설정에 실패했어요.");
    }
  }
  async function handleUnsetDefault() {
    if (!selected) return;
    try {
      await patchMaster(selected.id, { isDefault: false });
      await reloadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "기본 해제에 실패했어요.");
    }
  }
  async function handleCopy() {
    if (!selected) return;
    try {
      const copy = await copyMaster(selected.id);
      setEditingId(copy.id);
      await reloadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "복사에 실패했어요.");
    }
  }
  async function handleDelete() {
    if (!selected) return;
    if (!window.confirm(`"${selected.title ?? "마스터"}" 를 삭제할까요?`)) return;
    try {
      const result = await deleteMaster(selected.id);
      setEditingId(result.newDefaultId ?? null);
      await reloadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    }
  }

  return (
    <section style={{ padding: 32 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>자소서 마스터</h2>
      <div style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 20 }}>
        마스터 답변을 작성해두면 회사 지원 시 AI 가 자동으로 변형해드려요.
      </div>

      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}

      <div style={{
        display: "flex", gap: 0,
        borderBottom: "1px solid var(--color-border-default)",
        marginBottom: 16,
      }}>
        <div style={{
          padding: "10px 18px",
          background: "var(--color-primary-600)",
          color: "#fff",
          borderRadius: "6px 6px 0 0",
          fontWeight: 700, fontSize: 14,
        }}>
          ⭐ 마스터
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <ItemTypeList
          counts={counts}
          activeType={activeType}
          onSelect={(t) => { setActiveType(t); setEditingId(null); }}
          onAddMaster={() => setEditingId("NEW")}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          {typeRows === null ? (
            <div style={{ color: "var(--color-text-secondary)" }}>불러오는 중…</div>
          ) : (
            <>
              <MasterEditor
                key={editingId === "NEW" ? "new" : (selected?.id ?? "default")}
                itemType={activeType}
                master={selected}
                defaultExistsForType={defaultExistsForType}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
                onSetDefault={handleSetDefault}
                onUnsetDefault={handleUnsetDefault}
                onCopy={handleCopy}
                onDelete={handleDelete}
              />
              <OtherMastersList
                others={others.map((r) => ({
                  id: r.id, itemType: r.itemType, title: r.title,
                  charCount: r.masterAnswer.length, isDefault: r.isDefault, updatedAt: r.updatedAt,
                }))}
                onSelect={(id) => setEditingId(id)}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
