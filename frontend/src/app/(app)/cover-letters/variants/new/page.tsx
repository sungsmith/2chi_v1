import { CoverLetterWriteContent } from "@/components/cover-letters/write-content";
import type { ItemType } from "@/lib/types/cover-letter";

export default async function NewVariantPage({
  searchParams,
}: {
  searchParams: Promise<{ postingId?: string; itemType?: string; charLimit?: string }>;
}) {
  const sp = await searchParams;
  const postingId = Number(sp.postingId ?? 0);
  const itemType = (sp.itemType ?? "MOTIVATION") as ItemType;
  const charLimit = Number(sp.charLimit ?? 500);
  if (!postingId) {
    return <div style={{ padding: 32 }}>공고가 지정되지 않았어요. 공고 카드에서 시작해주세요.</div>;
  }
  return <CoverLetterWriteContent mode="new" postingId={postingId} itemType={itemType} charLimit={charLimit} />;
}
