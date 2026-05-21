import type {
  CoverLetterMaster,
  CoverLetterMasterSummary,
  MasterRequest,
  MasterPatchRequest,
  DeleteResult,
  ItemType,
} from "@/lib/types/cover-letter";
import { http } from "@/lib/api/http";

const BASE = "/api/v1/cover-letters/masters";

export async function fetchMasterSummary(): Promise<CoverLetterMasterSummary[]> {
  const res = await http(`${BASE}/summary`);
  return res.json();
}

export async function fetchMastersByType(itemType: ItemType): Promise<CoverLetterMaster[]> {
  const res = await http(`${BASE}?itemType=${encodeURIComponent(itemType)}`);
  return res.json();
}

export async function fetchMaster(id: number): Promise<CoverLetterMaster> {
  const res = await http(`${BASE}/${id}`);
  return res.json();
}

export async function createMaster(req: MasterRequest): Promise<CoverLetterMaster> {
  const res = await http(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function patchMaster(id: number, req: MasterPatchRequest): Promise<CoverLetterMaster> {
  const res = await http(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function copyMaster(id: number): Promise<CoverLetterMaster> {
  const res = await http(`${BASE}/${id}/copy`, { method: "POST" });
  return res.json();
}

export async function deleteMaster(id: number): Promise<DeleteResult> {
  const res = await http(`${BASE}/${id}`, { method: "DELETE" });
  return res.json();
}
