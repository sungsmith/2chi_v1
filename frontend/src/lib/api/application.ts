import { http } from "@/lib/api/http";
import type {
  Application,
  ApplicationSummary,
  ApplicationEvent,
  EventListItem,
  ApplicationCreateRequest,
  ApplicationPatchRequest,
  EventCreateRequest,
  EventPatchRequest,
  Stage,
  Result,
} from "@/lib/types/application";

const APP_BASE = "/api/v1/applications";
const EVT_BASE = "/api/v1/events";

export async function createApplication(req: ApplicationCreateRequest): Promise<Application> {
  const res = await http(APP_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function fetchApplications(filter?: {
  stage?: Stage; result?: Result;
}): Promise<ApplicationSummary[]> {
  const qs = new URLSearchParams();
  if (filter?.stage) qs.set("stage", filter.stage);
  if (filter?.result) qs.set("result", filter.result);
  const url = qs.toString() ? `${APP_BASE}?${qs}` : APP_BASE;
  const res = await http(url);
  return res.json();
}

export async function fetchApplication(id: number): Promise<Application> {
  const res = await http(`${APP_BASE}/${id}`);
  return res.json();
}

export async function patchApplication(id: number, req: ApplicationPatchRequest): Promise<Application> {
  const res = await http(`${APP_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deleteApplication(id: number): Promise<void> {
  await http(`${APP_BASE}/${id}`, { method: "DELETE" });
}

export async function createEvent(applicationId: number, req: EventCreateRequest): Promise<ApplicationEvent> {
  const res = await http(`${APP_BASE}/${applicationId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function patchEvent(id: number, req: EventPatchRequest): Promise<ApplicationEvent> {
  const res = await http(`${EVT_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deleteEvent(id: number): Promise<void> {
  await http(`${EVT_BASE}/${id}`, { method: "DELETE" });
}

export async function fetchEvents(from: string, to: string): Promise<EventListItem[]> {
  const res = await http(`${EVT_BASE}?from=${from}&to=${to}`);
  return res.json();
}
