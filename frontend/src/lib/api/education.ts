import { http } from "@/lib/api/http";
import type { Education, EducationRequest } from "@/lib/types/me-profile";

const BASE = "/api/v1/me/educations";

export async function fetchEducations(): Promise<Education[]> {
  const res = await http(BASE);
  return res.json();
}

export async function createEducation(req: EducationRequest): Promise<Education> {
  const res = await http(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function updateEducation(id: number, req: EducationRequest): Promise<Education> {
  const res = await http(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deleteEducation(id: number): Promise<void> {
  await http(`${BASE}/${id}`, { method: "DELETE" });
}
