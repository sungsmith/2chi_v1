import type {
  JobPosting,
  JobPostingCreateRequest,
  JobPostingPatchRequest,
  ParsedPosting,
} from "@/lib/types/posting";
import { http } from "@/lib/api/http";

const BASE = "/api/v1/postings";

export async function fetchPostings(): Promise<JobPosting[]> {
  const res = await http(BASE);
  return res.json();
}

export async function fetchPosting(id: number): Promise<JobPosting> {
  const res = await http(`${BASE}/${id}`);
  return res.json();
}

export async function createPosting(req: JobPostingCreateRequest): Promise<JobPosting> {
  const res = await http(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function patchPosting(id: number, req: JobPostingPatchRequest): Promise<JobPosting> {
  const res = await http(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deletePosting(id: number): Promise<void> {
  await http(`${BASE}/${id}`, { method: "DELETE" });
}

export async function parsePosting(url: string): Promise<ParsedPosting> {
  const res = await http(`${BASE}/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
}
