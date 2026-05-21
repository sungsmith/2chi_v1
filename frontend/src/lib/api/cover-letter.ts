import type {
  CoverLetterMaster,
  CoverLetterMasterSummary,
  MasterRequest,
  MasterPatchRequest,
  DeleteResult,
  ItemType,
  CoverLetterVariant,
  VariantListGroup,
  VariantCreateRequest,
  VariantPatchRequest,
  ValidationResult,
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

const VARIANT_BASE = "/api/v1/cover-letter-variants";

export async function fetchVariantsGrouped(): Promise<VariantListGroup[]> {
  const res = await http(`${VARIANT_BASE}/grouped`);
  return res.json();
}

export async function fetchVariant(id: number): Promise<CoverLetterVariant> {
  const res = await http(`${VARIANT_BASE}/${id}`);
  return res.json();
}

export async function createVariant(req: VariantCreateRequest): Promise<CoverLetterVariant> {
  const res = await http(VARIANT_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function patchVariant(id: number, req: VariantPatchRequest): Promise<CoverLetterVariant> {
  const res = await http(`${VARIANT_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deleteVariant(id: number): Promise<void> {
  await http(`${VARIANT_BASE}/${id}`, { method: "DELETE" });
}

export async function fetchValidation(id: number): Promise<ValidationResult> {
  const res = await http(`${VARIANT_BASE}/${id}/validation`);
  return res.json();
}
