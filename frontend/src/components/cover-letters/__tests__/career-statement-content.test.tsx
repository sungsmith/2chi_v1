import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CareerStatementContent } from "../career-statement-content";
import { POSTINGS_FOR_PICKER_MOCK, CAREER_STATEMENT_RESULT_MOCK } from "@/lib/mock/cover-letters";

describe("CareerStatementContent", () => {
  it("renders posting picker with all postings", () => {
    render(<CareerStatementContent postings={POSTINGS_FOR_PICKER_MOCK} result={CAREER_STATEMENT_RESULT_MOCK} />);
    expect(screen.getByText("네이버")).toBeInTheDocument();
    expect(screen.getByText("카카오")).toBeInTheDocument();
    expect(screen.getByText("토스")).toBeInTheDocument();
  });

  it("renders selected posting highlight", () => {
    render(<CareerStatementContent postings={POSTINGS_FOR_PICKER_MOCK} result={CAREER_STATEMENT_RESULT_MOCK} />);
    const selected = document.querySelector(".posting-picker .item.selected");
    expect(selected).not.toBeNull();
  });

  it("renders result project name + 3 sections (Problem · Approach · Result)", () => {
    render(<CareerStatementContent postings={POSTINGS_FOR_PICKER_MOCK} result={CAREER_STATEMENT_RESULT_MOCK} />);
    expect(screen.getByText(/식권 정산 API/)).toBeInTheDocument();
    expect(screen.getByText("Problem")).toBeInTheDocument();
    expect(screen.getByText("Approach")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
