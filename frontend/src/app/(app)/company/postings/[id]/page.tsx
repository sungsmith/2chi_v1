import { notFound } from "next/navigation";
import { PostingDetailLoader } from "@/components/company/posting-detail-content";

export default async function PostingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postingId = Number(id);
  if (Number.isNaN(postingId)) notFound();

  return <PostingDetailLoader id={postingId} />;
}
