import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverLetterWriteContent } from "../write-content";

const createMock = vi.fn();
const fetchMock = vi.fn();
const patchMock = vi.fn();
const replaceMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/lib/api/cover-letter", () => ({
  createVariant: (...a: unknown[]) => createMock(...a),
  fetchVariant: (...a: unknown[]) => fetchMock(...a),
  patchVariant: (...a: unknown[]) => patchMock(...a),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
}));

const sampleVariant = {
  id: 99, postingId: 1, postingCompany: "(주)테크", postingTitle: "백엔드",
  analysisId: null, itemType: "MOTIVATION", question: "Q", charLimit: 500,
  aiDraft: "AI 초안 본문", userEdit: "AI 초안 본문", userRequest: null,
  validationJson: null, status: "DRAFT" as const, aiModel: "gpt-4o-mini", aiTokensUsed: 1200,
  createdAt: "2026-05-21T10:00:00Z", updatedAt: "2026-05-21T10:00:00Z",
};

beforeEach(() => {
  createMock.mockReset(); fetchMock.mockReset(); patchMock.mockReset();
  replaceMock.mockReset(); pushMock.mockReset();
});

describe("CoverLetterWriteContent", () => {
  test("new 모드 — AI 초안 생성 → 좌·우 분할 + URL replace", async () => {
    createMock.mockResolvedValue(sampleVariant);
    const user = userEvent.setup();
    render(<CoverLetterWriteContent mode="new" postingId={1} itemType="MOTIVATION" charLimit={500} />);

    await user.click(screen.getByRole("button", { name: /AI 초안 생성/ }));

    await waitFor(() => expect(createMock).toHaveBeenCalled());
    expect(replaceMock).toHaveBeenCalledWith("/cover-letters/variants/99");
    expect(screen.getByText("AI 초안 본문", { selector: "div" })).toBeInTheDocument();
  });

  test("edit 모드 — variant fetch + 편집 + 임시 저장 PATCH", async () => {
    fetchMock.mockResolvedValue(sampleVariant);
    patchMock.mockResolvedValue({ ...sampleVariant, userEdit: "수정됨" });
    const user = userEvent.setup();
    render(<CoverLetterWriteContent mode="edit" id={99} />);

    await screen.findByText("AI 초안 본문", { selector: "div" });
    const textarea = screen.getByLabelText("자소서 수정본");
    await user.clear(textarea);
    await user.type(textarea, "수정됨");
    await user.click(screen.getByRole("button", { name: /임시 저장/ }));

    await waitFor(() => expect(patchMock).toHaveBeenCalledWith(99, expect.objectContaining({
      userEdit: "수정됨",
      status: "DRAFT",
    })));
  });

  test("완료 저장 → status=COMPLETED + 목록으로 push", async () => {
    fetchMock.mockResolvedValue(sampleVariant);
    patchMock.mockResolvedValue({ ...sampleVariant, status: "COMPLETED" });
    const user = userEvent.setup();
    render(<CoverLetterWriteContent mode="edit" id={99} />);
    await screen.findByText("AI 초안 본문", { selector: "div" });

    await user.click(screen.getByRole("button", { name: /완료 저장/ }));
    await waitFor(() => expect(patchMock).toHaveBeenCalledWith(99, expect.objectContaining({
      status: "COMPLETED",
    })));
    expect(pushMock).toHaveBeenCalledWith("/cover-letters");
  });
});
