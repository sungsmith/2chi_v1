import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PostingCard } from "../posting-card";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/api/company-analysis", () => ({
  fetchAnalysisByCompany: vi.fn(),
}));

vi.mock("@/lib/api/application", () => ({
  createApplication: vi.fn(),
}));

import { createApplication } from "@/lib/api/application";

const POSTING = {
  id: 10, company: "(주)테크", title: "백엔드 (2~5년)", jobRole: "백엔드",
  deadline: "2026-06-30", sourceUrl: null, keywords: [], createdAt: "", updatedAt: "",
};

describe("PostingCard", () => {
  it("미지원 카드: ✅지원함 클릭 시 createApplication 호출 + onApplied", async () => {
    vi.mocked(createApplication).mockResolvedValue({ id: 99 } as never);
    const onApplied = vi.fn();
    render(<PostingCard
      posting={POSTING as never}
      applicationId={null}
      onEdit={vi.fn()} onDelete={vi.fn()}
      onApplied={onApplied}
    />);
    fireEvent.click(screen.getByText("✅ 지원함"));
    await waitFor(() => expect(createApplication).toHaveBeenCalledWith({ postingId: 10 }));
    expect(onApplied).toHaveBeenCalledWith(10, 99);
  });

  it("이미 지원한 카드: ✓ 지원 중 클릭 시 router.push", () => {
    pushMock.mockClear();
    render(<PostingCard
      posting={POSTING as never}
      applicationId={99}
      onEdit={vi.fn()} onDelete={vi.fn()}
      onApplied={vi.fn()}
    />);
    fireEvent.click(screen.getByText("✓ 지원 중"));
    expect(pushMock).toHaveBeenCalledWith("/applications");
  });
});
