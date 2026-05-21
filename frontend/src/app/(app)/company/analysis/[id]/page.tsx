import { AnalysisDetailContent } from "@/components/company/analysis-detail-content";

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnalysisDetailContent id={Number(id)} />;
}
