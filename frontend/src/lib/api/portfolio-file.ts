import { http } from "@/lib/api/http";
import type { PortfolioFile } from "@/lib/types/me-portfolio-file";

const BASE = "/api/v1/me/portfolio-files";

export async function fetchPortfolioFiles(): Promise<PortfolioFile[]> {
  const res = await http(BASE);
  const data = await res.json();
  return data.files;
}

export async function uploadPortfolioFile(file: File): Promise<PortfolioFile> {
  const form = new FormData();
  form.append("file", file);
  const res = await http(BASE, { method: "POST", body: form });
  return res.json();
}

export async function getPortfolioFileDownloadUrl(id: number): Promise<string> {
  const res = await http(`${BASE}/${id}/download`);
  const data = await res.json();
  return data.url;
}

export async function deletePortfolioFile(id: number): Promise<void> {
  await http(`${BASE}/${id}`, { method: "DELETE" });
}
