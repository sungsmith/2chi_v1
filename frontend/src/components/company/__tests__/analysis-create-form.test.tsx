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

  test("검색 버튼 클릭 → DART 후보 목록 표시", async () => {
    const user = userEvent.setup();
    render(<AnalysisCreateForm />);

    await user.click(screen.getByRole("button", { name: /검색/ }));
    expect(screen.getByText("동명 기업 후보 · 3")).toBeInTheDocument();
    expect(screen.getByText("주식회사 카카오")).toBeInTheDocument();
  });

  test("후보 선택 후 분석 시작 → API call + navigate", async () => {
    createMock.mockResolvedValue({ id: 99, company: "주식회사 카카오", summaryJson: "{}", sourceUrls: [], generatedAt: "x", generatedBy: "y", expiresInDays: 30 });
    const user = userEvent.setup();
    render(<AnalysisCreateForm />);

    await user.click(screen.getByRole("button", { name: /검색/ }));
    await user.click(screen.getByRole("button", { name: /선택하고 분석 시작/ }));

    await waitFor(() => expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      company: "주식회사 카카오",
    })));
    expect(pushMock).toHaveBeenCalledWith("/company/analysis/99");
  });

  test("직접 입력으로 분석 시작 → API call + navigate", async () => {
    createMock.mockResolvedValue({ id: 42, company: "(주)테크", summaryJson: "{}", sourceUrls: [], generatedAt: "x", generatedBy: "y", expiresInDays: 30 });
    const user = userEvent.setup();
    render(<AnalysisCreateForm />);

    await user.type(screen.getByRole("textbox", { name: /회사명/ }), "(주)테크");
    await user.click(screen.getByRole("button", { name: /분석 시작/ }));

    await waitFor(() => expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      company: "(주)테크",
    })));
    expect(pushMock).toHaveBeenCalledWith("/company/analysis/42");
  });
});
