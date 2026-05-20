import { http } from "@/lib/api/http";
import type {
  Career,
  Project,
  CareerCreateRequest,
  ProjectCreateRequest,
  ProjectPatchRequest,
} from "@/lib/types/career";

const BASE = "/api/v1/me/careers";

export async function fetchCareers(): Promise<Career[]> {
  const res = await http(BASE);
  const body = (await res.json()) as { careers: Career[] };
  return body.careers;
}

export async function createCareer(req: CareerCreateRequest): Promise<Career> {
  const res = await http(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json() as Promise<Career>;
}

export async function updateCareer(
  careerId: number,
  req: CareerCreateRequest
): Promise<Career> {
  const res = await http(`${BASE}/${careerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json() as Promise<Career>;
}

export async function deleteCareer(careerId: number): Promise<void> {
  await http(`${BASE}/${careerId}`, { method: "DELETE" });
}

export async function createProject(
  careerId: number,
  req: ProjectCreateRequest
): Promise<Project> {
  const res = await http(`${BASE}/${careerId}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json() as Promise<Project>;
}

export async function patchProject(
  careerId: number,
  projectId: number,
  patch: ProjectPatchRequest
): Promise<Project> {
  const res = await http(`${BASE}/${careerId}/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json() as Promise<Project>;
}

export async function deleteProject(
  careerId: number,
  projectId: number
): Promise<void> {
  await http(`${BASE}/${careerId}/projects/${projectId}`, { method: "DELETE" });
}
