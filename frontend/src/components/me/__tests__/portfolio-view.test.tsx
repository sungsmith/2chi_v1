import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PortfolioView } from "../portfolio-view";
import { PORTFOLIO_MOCK } from "@/lib/mock/me";

describe("PortfolioView", () => {
  it("renders link list with titles + urls", () => {
    render(<PortfolioView data={PORTFOLIO_MOCK} />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("기술 블로그")).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(3);
  });

  it("renders file list with filenames", () => {
    render(<PortfolioView data={PORTFOLIO_MOCK} />);
    expect(screen.getByText("portfolio-2026q2.pdf")).toBeInTheDocument();
  });

  it("renders empty state when no links and no files", () => {
    render(<PortfolioView data={{ links: [], files: [] }} />);
    expect(screen.getByText(/아직 등록된 포트폴리오가 없어요|첫 링크/i)).toBeInTheDocument();
  });
});
