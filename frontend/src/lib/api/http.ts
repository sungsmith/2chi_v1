const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

let accessToken: string | null = null;
let refreshing: Promise<void> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function http(input: string, init: RequestInit = {}): Promise<Response> {
  const url = input.startsWith("http") ? input : apiUrl(input);
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(url, { ...init, headers, credentials: "include" });
  if (res.status !== 401) return res;

  if (!refreshing) {
    refreshing = doRefresh().finally(() => { refreshing = null; });
  }
  await refreshing;
  if (!accessToken) return res;

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${accessToken}`);
  return fetch(url, { ...init, headers: retryHeaders, credentials: "include" });
}

async function doRefresh(): Promise<void> {
  const res = await fetch(apiUrl("/api/v1/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    accessToken = null;
    return;
  }
  const body = await res.json() as { accessToken: string };
  accessToken = body.accessToken;
}
