import type {
  CompanyAnalysis, CompanyAnalysisSummaryResponse,
  AnalysisCreateRequest, ByCompanyResponse,
} from "@/lib/types/company-analysis";
import { http } from "@/lib/api/http";

const BASE = "/api/v1/company-analyses";

export async function fetchAnalyses(): Promise<CompanyAnalysisSummaryResponse[]> {
  const res = await http(BASE);
  return res.json();
}

export async function fetchAnalysis(id: number): Promise<CompanyAnalysis> {
  const res = await http(`${BASE}/${id}`);
  return res.json();
}

export async function fetchAnalysisByCompany(company: string): Promise<ByCompanyResponse> {
  const res = await http(`${BASE}/by-company?company=${encodeURIComponent(company)}`);
  return res.json();
}

export async function createOrReplaceAnalysis(req: AnalysisCreateRequest): Promise<CompanyAnalysis> {
  const res = await http(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deleteAnalysis(id: number): Promise<void> {
  await http(`${BASE}/${id}`, { method: "DELETE" });
}
