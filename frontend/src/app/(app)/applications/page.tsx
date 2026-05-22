import { ApplicationsContent } from "@/components/applications/applications-content";

type Props = {
  searchParams: Promise<{ stage?: string; result?: string; sort?: string }>;
};

export default async function ApplicationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  return <ApplicationsContent stage={sp.stage} result={sp.result} sort={sp.sort} />;
}
