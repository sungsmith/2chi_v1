import { describe, it, expect, vi, beforeEach } from "vitest";

const httpMock = vi.fn();
vi.mock("@/lib/api/http", () => ({ http: (...a: unknown[]) => httpMock(...a) }));

import { fetchDashboardMatch, fetchPostingMatches } from "../match";

beforeEach(() => httpMock.mockReset());

describe("fetchDashboardMatch", () => {
  it("엔드포인트 호출 + 응답 객체 반환", async () => {
    const payload = { percent: 50, postingCount: 1, gaps: [{ keyword: "Kafka", hitCount: 1 }] };
    httpMock.mockResolvedValue({ json: async () => payload });
    const res = await fetchDashboardMatch();
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/match/dashboard");
    expect(res).toEqual(payload);
  });
});

describe("fetchPostingMatches", () => {
  it("엔드포인트 호출 + {matches} 언래핑", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ matches: [{ postingId: 7, percent: 50 }] }) });
    const res = await fetchPostingMatches();
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/match/postings");
    expect(res).toEqual([{ postingId: 7, percent: 50 }]);
  });
});
