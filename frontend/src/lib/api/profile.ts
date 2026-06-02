import { http } from "@/lib/api/http";
import type { ProfileBasic, ProfileBasicUpdateRequest } from "@/lib/types/me-profile";

const BASE = "/api/v1/me/profile";

export async function fetchProfile(): Promise<ProfileBasic> {
  const res = await http(BASE);
  return res.json();
}

export async function updateProfileBasic(req: ProfileBasicUpdateRequest): Promise<ProfileBasic> {
  const res = await http(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}
