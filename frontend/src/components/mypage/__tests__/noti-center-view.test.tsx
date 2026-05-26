import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NotiCenterView } from "../noti-center-view";
import { NOTI_CENTER_MOCK } from "@/lib/mock/mypage";

describe("NotiCenterView", () => {
  it("renders all notification entries", () => {
    render(<NotiCenterView entries={NOTI_CENTER_MOCK} />);
    // Verify a sample of entries from the mock
    expect(screen.getByText("카카오 백엔드 (Saas 팀) 서류 마감이 오늘 23:59예요")).toBeInTheDocument();
    expect(screen.getByText("기업분석 — 카카오 분석이 완료됐어요")).toBeInTheDocument();
  });

  it("renders bulk action buttons as disabled", () => {
    render(<NotiCenterView entries={NOTI_CENTER_MOCK} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
