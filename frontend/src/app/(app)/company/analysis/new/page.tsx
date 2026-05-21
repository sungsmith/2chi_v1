import { AnalysisCreateForm } from "@/components/company/analysis-create-form";

export default async function NewAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const sp = await searchParams;
  return <AnalysisCreateForm initialCompany={sp.company ?? ""} />;
}
