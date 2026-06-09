import { http } from "@/lib/api/http";
import type { DashboardMatch } from "@/lib/types/match";

export async function fetchDashboardMatch(): Promise<DashboardMatch> {
  const res = await http("/api/v1/me/match/dashboard");
  return res.json();
}
