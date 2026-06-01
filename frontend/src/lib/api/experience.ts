import { http } from "@/lib/api/http";
import type { Experience, ExperienceRequest } from "@/lib/types/me-profile";

const BASE = "/api/v1/me/experiences";

export async function fetchExperiences(): Promise<Experience[]> {
  const res = await http(BASE);
  return res.json();
}

export async function createExperience(req: ExperienceRequest): Promise<Experience> {
  const res = await http(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function updateExperience(id: number, req: ExperienceRequest): Promise<Experience> {
  const res = await http(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deleteExperience(id: number): Promise<void> {
  await http(`${BASE}/${id}`, { method: "DELETE" });
}
