import { describe, it, expect, vi, beforeEach } from "vitest";

const httpMock = vi.fn();
vi.mock("@/lib/api/http", () => ({ http: (...a: unknown[]) => httpMock(...a) }));

import { fetchPortfolioLinks, createPortfolioLink, deletePortfolioLink } from "../portfolio";

beforeEach(() => httpMock.mockReset());

describe("portfolio api", () => {
  it("fetch 는 {links} 를 언래핑해 배열 반환", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ links: [{ id: 1, kind: "GITHUB", title: "g", url: "https://github.com/x", orderIndex: 0 }] }) });
    const res = await fetchPortfolioLinks();
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-links");
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].kind).toBe("GITHUB");
  });

  it("create 는 POST 로 body 전송", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ id: 2, kind: "BLOG", title: "b", url: "https://b.dev", orderIndex: 1 }) });
    await createPortfolioLink({ kind: "BLOG", title: "b", url: "https://b.dev" });
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-links", expect.objectContaining({ method: "POST" }));
  });

  it("delete 는 DELETE 메서드", async () => {
    httpMock.mockResolvedValue({ json: async () => ({}) });
    await deletePortfolioLink(5);
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-links/5", expect.objectContaining({ method: "DELETE" }));
  });
});
