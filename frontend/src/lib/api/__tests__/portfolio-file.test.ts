import { describe, it, expect, vi, beforeEach } from "vitest";

const httpMock = vi.fn();
vi.mock("@/lib/api/http", () => ({ http: (...a: unknown[]) => httpMock(...a) }));

import { fetchPortfolioFiles, uploadPortfolioFile, getPortfolioFileDownloadUrl, deletePortfolioFile } from "../portfolio-file";

beforeEach(() => httpMock.mockReset());

describe("portfolio-file api", () => {
  it("목록은 {files} 언래핑", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ files: [{ id: 1, filename: "a.pdf", contentType: "application/pdf", sizeBytes: 10, createdAt: "2026-06-10T00:00:00Z" }] }) });
    const res = await fetchPortfolioFiles();
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-files");
    expect(res[0].filename).toBe("a.pdf");
  });

  it("업로드는 POST + FormData(file)", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ id: 2 }) });
    const file = new File(["x"], "r.pdf", { type: "application/pdf" });
    await uploadPortfolioFile(file);
    const call = httpMock.mock.calls[0];
    expect(call[0]).toBe("/api/v1/me/portfolio-files");
    expect(call[1].method).toBe("POST");
    expect(call[1].body).toBeInstanceOf(FormData);
    expect((call[1].body as FormData).get("file")).toBe(file);
  });

  it("다운로드 URL 조회", async () => {
    httpMock.mockResolvedValue({ json: async () => ({ url: "http://minio/x?sig=1" }) });
    const url = await getPortfolioFileDownloadUrl(5);
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-files/5/download");
    expect(url).toBe("http://minio/x?sig=1");
  });

  it("삭제는 DELETE", async () => {
    httpMock.mockResolvedValue({ json: async () => ({}) });
    await deletePortfolioFile(7);
    expect(httpMock).toHaveBeenCalledWith("/api/v1/me/portfolio-files/7", expect.objectContaining({ method: "DELETE" }));
  });
});
