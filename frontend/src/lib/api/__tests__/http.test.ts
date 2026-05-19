import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { http, setAccessToken } from "../http";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  setAccessToken(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("http()", () => {
  test("access 없을 때 Authorization 헤더 없음", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    await http("/api/v1/users/me");
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Authorization")).toBeNull();
  });

  test("access 있을 때 Bearer 헤더 첨부", async () => {
    setAccessToken("abc.def.ghi");
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    await http("/api/v1/users/me");
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Authorization")).toBe("Bearer abc.def.ghi");
  });

  test("401 → /refresh 성공 → 새 access 로 재시도", async () => {
    setAccessToken("old.token");
    fetchMock
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "new.token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));

    const res = await http("/api/v1/users/me");
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [, retryInit] = fetchMock.mock.calls[2];
    const headers = new Headers((retryInit as RequestInit).headers);
    expect(headers.get("Authorization")).toBe("Bearer new.token");
  });

  test("401 → /refresh 401 → 원래 401 반환, accessToken null", async () => {
    setAccessToken("old.token");
    fetchMock
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response("", { status: 401 }));

    const res = await http("/api/v1/users/me");
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("동시 401 두 건 — /refresh 1회만 호출", async () => {
    setAccessToken("old.token");
    fetchMock
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "new.token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const [a, b] = await Promise.all([
      http("/api/v1/users/me"),
      http("/api/v1/applications"),
    ]);

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/api/v1/auth/refresh"));
    expect(refreshCalls.length).toBe(1);
  });
});
