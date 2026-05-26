import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NotiSettingsView } from "../noti-settings-view";
import { NOTI_SETTINGS_MOCK } from "@/lib/mock/mypage";

describe("NotiSettingsView", () => {
  it("renders multiple categories", () => {
    render(<NotiSettingsView items={NOTI_SETTINGS_MOCK} />);
    expect(screen.getByText("전형 일정 · 마감")).toBeInTheDocument();
    expect(screen.getByText("제품 안내")).toBeInTheDocument();
    expect(screen.getByText("계정 보안")).toBeInTheDocument();
    expect(screen.getByText("알림 채널")).toBeInTheDocument();
  });

  it("renders all toggles as non-interactive (switch spans, not inputs)", () => {
    render(<NotiSettingsView items={NOTI_SETTINGS_MOCK} />);
    // All non-locked rows use a <span class="switch"> — not a checkbox/button
    const switches = document.querySelectorAll("span.switch");
    // 12 items total, 3 are locked → 9 switches
    expect(switches.length).toBe(9);
    // Buttons in push-card are disabled
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
