import { CoverLetterWriteContent } from "@/components/cover-letters/write-content";

export default async function VariantEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CoverLetterWriteContent mode="edit" id={Number(id)} />;
}
