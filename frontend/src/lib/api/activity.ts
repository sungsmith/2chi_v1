import { http } from "@/lib/api/http";
import type { ActivityCategory, ActivityListResponse } from "@/lib/types/activity";

const BASE = "/api/v1/activities";

export async function fetchActivities(opts: {
  category?: ActivityCategory;
  page: number;
  size: number;
}): Promise<ActivityListResponse> {
  const qs = new URLSearchParams();
  if (opts.category) qs.set("category", opts.category);
  qs.set("page", String(opts.page));
  qs.set("size", String(opts.size));
  const res = await http(`${BASE}?${qs}`);
  return res.json();
}
