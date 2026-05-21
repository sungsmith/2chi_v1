import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalysisCreateForm } from "../analysis-create-form";

const createMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/lib/api/company-analysis", () => ({
  createOrReplaceAnalysis: (...a: unknown[]) => createMock(...a),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}));

beforeEach(() => { createMock.mockReset(); pushMock.mockReset(); });

describe("AnalysisCreateForm", () => {
  test("초기 회사명 prop 으로 input 채워짐", () => {
    render(<AnalysisCreateForm initialCompany="(주)테크" />);
    expect(screen.getByDisplayValue("(주)테크")).toBeInTheDocument();
  });

  test("URL 추가 버튼 → row 증가 (최대 5)", async () => {
    const user = userEvent.setup();
    render(<AnalysisCreateForm />);

    const addBtn = screen.getByRole("button", { name: /URL 추가/ });
    expect(addBtn).toHaveTextContent("1/5");
    const inputs = screen.getAllByPlaceholderText(/example/);
    await user.type(inputs[0], "https://a.com");
    await user.click(addBtn);
    expect(screen.getAllByPlaceholderText(/example/).length).toBeGreaterThanOrEqual(2);
  });

  test("회사명 + URL 으로 제출 → API call + navigate", async () => {
    createMock.mockResolvedValue({ id: 99, company: "(주)테크", summaryJson: "{}", sourceUrls: [], generatedAt: "x", generatedBy: "y", expiresInDays: 30 });
    const user = userEvent.setup();
    render(<AnalysisCreateForm />);

    await user.type(screen.getByLabelText(/회사명/), "(주)테크");
    await user.click(screen.getByRole("button", { name: /분석 생성/ }));

    await waitFor(() => expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      company: "(주)테크",
    })));
    expect(pushMock).toHaveBeenCalledWith("/company/analysis/99");
  });
});
