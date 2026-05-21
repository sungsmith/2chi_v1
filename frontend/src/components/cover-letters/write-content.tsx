"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WriteInputPanel } from "./write-input-panel";
import { WriteDualPane } from "./write-dual-pane";
import { WriteValidationPanel } from "./write-validation-panel";
import {
  createVariant, fetchVariant, patchVariant,
} from "@/lib/api/cover-letter";
import { fetchPosting } from "@/lib/api/posting";
import { fetchAnalysisByCompany } from "@/lib/api/company-analysis";
import type { JobPosting } from "@/lib/types/posting";
import type { ByCompanyResponse } from "@/lib/types/company-analysis";
import {
  type CoverLetterVariant, type ItemType, ITEM_TYPE_QUESTIONS,
} from "@/lib/types/cover-letter";

type NewProps = {
  mode: "new";
  postingId: number;
  itemType: ItemType;
  charLimit: number;
};
type EditProps = { mode: "edit"; id: number };
type Props = NewProps | EditProps;

export function CoverLetterWriteContent(props: Props) {
  const router = useRouter();
  const [variant, setVariant] = useState<CoverLetterVariant | null>(null);
  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [analysisRef, setAnalysisRef] = useState<ByCompanyResponse | null>(null);
  const [userEdit, setUserEdit] = useState("");
  const [userRequest, setUserRequest] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const newPostingPreview = props.mode === "new"
    ? { itemType: props.itemType, charLimit: props.charLimit, postingId: props.postingId }
    : null;

  useEffect(() => {
    if (props.mode === "edit") {
      fetchVariant(props.id)
        .then((v) => {
          setVariant(v);
          setUserEdit(v.userEdit ?? "");
          setUserRequest(v.userRequest ?? "");
          // edit 모드에서도 keywords 매칭 강화 위해 posting fetch
          if (v.postingId != null) {
            fetchPosting(v.postingId)
              .then(setPosting)
              .catch(() => { /* keyword 매칭만 영향, 무시 */ });
          }
        })
        .catch((e) => setError(e instanceof Error ? e.message : "자소서를 불러오지 못했어요."));
    } else {
      // new 모드: 입력 패널 표시용 + keywords 실시간 매칭용 posting fetch
      fetchPosting(props.postingId)
        .then(setPosting)
        .catch((e) => setError(e instanceof Error ? e.message : "공고 정보를 불러오지 못했어요."));
    }
  }, [props]);

  useEffect(() => {
    if (posting?.company) {
      fetchAnalysisByCompany(posting.company)
        .then(setAnalysisRef)
        .catch(() => setAnalysisRef({ id: null, company: posting.company }));
    }
  }, [posting]);

  async function handleGenerate() {
    if (props.mode !== "new") return;
    setGenerating(true);
    setError(undefined);
    try {
      const created = await createVariant({
        postingId: props.postingId,
        analysisId: analysisRef?.id ?? undefined,
        itemType: props.itemType,
        question: ITEM_TYPE_QUESTIONS[props.itemType],
        charLimit: props.charLimit,
        userRequest: userRequest || undefined,
      });
      setVariant(created);
      setUserEdit(created.userEdit ?? "");
      router.replace(`/cover-letters/variants/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 초안 생성에 실패했어요.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(targetStatus: "DRAFT" | "COMPLETED") {
    if (!variant) return;
    setSaving(true);
    setError(undefined);
    try {
      const updated = await patchVariant(variant.id, {
        userEdit,
        userRequest,
        status: targetStatus,
      });
      setVariant(updated);
      if (targetStatus === "COMPLETED") {
        router.push("/cover-letters");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  const itemType = variant?.itemType ?? newPostingPreview?.itemType ?? "MOTIVATION";
  const charLimit = variant?.charLimit ?? newPostingPreview?.charLimit ?? 500;
  // posting 정보: variant 의 응답이 1순위, 별도 fetch 한 posting 이 2순위
  const postingCompany = variant?.postingCompany ?? posting?.company ?? "(공고 정보 로딩 중)";
  const postingTitle = variant?.postingTitle ?? posting?.title ?? "";

  // 실시간 JD 키워드 매칭 — posting fetch 결과의 keywords 사용
  const postingKeywords: string[] = posting?.keywords ?? [];

  return (
    <section style={{ padding: 32 }}>
      <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 12 }}>
        자소서 &gt; {postingCompany} &gt; {variant?.question ?? ITEM_TYPE_QUESTIONS[itemType]}
      </div>

      {error && (
        <div role="alert" style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--color-semantic-error-bg)", color: "var(--color-semantic-error)",
          borderRadius: "var(--radius-md)", fontSize: 13,
        }}>{error}</div>
      )}

      <WriteInputPanel
        itemType={itemType}
        charLimit={charLimit}
        postingCompany={postingCompany}
        postingTitle={postingTitle}
        analysisRef={analysisRef}
        userRequest={userRequest}
        onUserRequestChange={setUserRequest}
        onGenerate={handleGenerate}
        generating={generating}
        hasDraft={variant !== null}
        readOnly={variant !== null}
      />

      {variant && (
        <>
          <WriteDualPane
            aiDraft={variant.aiDraft ?? ""}
            userEdit={userEdit}
            onUserEditChange={setUserEdit}
            aiModel={variant.aiModel}
          />
          <WriteValidationPanel
            userEdit={userEdit}
            charLimit={charLimit}
            postingKeywords={postingKeywords}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn ghost" onClick={() => handleSave("DRAFT")} disabled={saving}>
              임시 저장
            </button>
            <button className="btn" onClick={() => handleSave("COMPLETED")} disabled={saving}>
              완료 저장
            </button>
          </div>
        </>
      )}
    </section>
  );
}
