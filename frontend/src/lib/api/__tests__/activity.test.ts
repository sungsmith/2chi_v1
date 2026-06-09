import { describe, it, expect, vi, beforeEach } from "vitest";

const httpMock = vi.fn();
vi.mock("@/lib/api/http", () => ({ http: (...a: unknown[]) => httpMock(...a) }));

import { fetchActivities } from "../activity";

beforeEach(() => httpMock.mockReset());

describe("fetchActivities", () => {
  it("카테고리·페이지 쿼리스트링을 붙이고 응답 객체를 반환", async () => {
    const payload = { activities: [], totalCount: 0, page: 0, size: 30, hasNext: false,
      counts: { STAGE: 0, COVER_LETTER: 0, NOTIFICATION: 0, APPLICATION: 0 } };
    httpMock.mockResolvedValue({ json: async () => payload });
    const res = await fetchActivities({ category: "STAGE", page: 1, size: 30 });
    expect(httpMock).toHaveBeenCalledWith("/api/v1/activities?category=STAGE&page=1&size=30");
    expect(res).toEqual(payload);
  });

  it("필터 없으면 page/size 만", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ activities: [] }) });
    await fetchActivities({ page: 0, size: 30 });
    expect(httpMock).toHaveBeenCalledWith("/api/v1/activities?page=0&size=30");
  });
});
