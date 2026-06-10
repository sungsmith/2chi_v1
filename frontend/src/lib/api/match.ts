import { http } from "@/lib/api/http";
import type { DashboardMatch, PostingMatch } from "@/lib/types/match";

export async function fetchDashboardMatch(): Promise<DashboardMatch> {
  const res = await http("/api/v1/me/match/dashboard");
  return res.json();
}

export async function fetchPostingMatches(): Promise<PostingMatch[]> {
  const res = await http("/api/v1/me/match/postings");
  const data = await res.json();
  return data.matches;
}
