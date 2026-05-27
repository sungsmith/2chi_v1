import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotiSettingsView } from "../noti-settings-view";
import type { NotiSettingItemDto, NotiSettingsResponse } from "@/lib/types/mypage";

const fetchNotiSettingsMock = vi.fn();
const updateNotiSettingsMock = vi.fn();

vi.mock("@/lib/api/mypage", () => ({
  fetchNotiSettings: (...args: unknown[]) => fetchNotiSettingsMock(...args),
  updateNotiSettings: (...args: unknown[]) => updateNotiSettingsMock(...args),
}));

const sampleItems: NotiSettingItemDto[] = [
  { id: "deadline-d3", category: "전형 일정 · 마감", label: "채용공고 마감 D-3", description: "마감 3일 전 09:00에 받기", enabled: true, locked: false },
  { id: "weekly-summary", category: "제품 안내", label: "주간 요약", description: "이번 주 자소서·지원 현황 요약 (매주 월요일 09:00)", enabled: false, locked: false },
  { id: "signup-verify", category: "계정 보안", label: "회원가입 인증", description: "가입 직후 이메일 인증 코드 발송", enabled: true, locked: true },
];

beforeEach(() => {
  fetchNotiSettingsMock.mockReset();
  updateNotiSettingsMock.mockReset();
});

describe("NotiSettingsView", () => {
  it("renders 3 items after fetch", async () => {
    fetchNotiSettingsMock.mockResolvedValueOnce({ settings: sampleItems } satisfies NotiSettingsResponse);
    render(<NotiSettingsView />);

    expect(await screen.findByText("채용공고 마감 D-3")).toBeInTheDocument();
    expect(screen.getByText("주간 요약")).toBeInTheDocument();
    expect(screen.getByText("회원가입 인증")).toBeInTheDocument();
  });

  it("toggle calls updateNotiSettings with single override (optimistic)", async () => {
    fetchNotiSettingsMock.mockResolvedValueOnce({ settings: sampleItems });
    const updatedItems = sampleItems.map((i) => i.id === "deadline-d3" ? { ...i, enabled: false } : i);
    updateNotiSettingsMock.mockResolvedValueOnce({ settings: updatedItems });

    render(<NotiSettingsView />);
    await screen.findByText("채용공고 마감 D-3");

    const toggle = screen.getByRole("button", { name: /채용공고 마감 D-3 알림 켜짐/ });
    await userEvent.click(toggle);

    await waitFor(() => expect(updateNotiSettingsMock).toHaveBeenCalledWith([{ id: "deadline-d3", enabled: false }]));
    // BE 응답으로 sync — 토글이 꺼짐 상태로 표시
    await waitFor(() => expect(screen.getByRole("button", { name: /채용공고 마감 D-3 알림 꺼짐/ })).toBeInTheDocument());
  });

  it("reverts on API failure and shows error banner", async () => {
    fetchNotiSettingsMock.mockResolvedValueOnce({ settings: sampleItems });
    updateNotiSettingsMock.mockRejectedValueOnce(new Error("저장에 실패했어요."));

    render(<NotiSettingsView />);
    await screen.findByText("채용공고 마감 D-3");

    const toggle = screen.getByRole("button", { name: /채용공고 마감 D-3 알림 켜짐/ });
    await userEvent.click(toggle);

    expect(await screen.findByRole("alert")).toHaveTextContent("저장에 실패했어요.");
    // revert — 다시 켜짐 상태
    await waitFor(() => expect(screen.getByRole("button", { name: /채용공고 마감 D-3 알림 켜짐/ })).toBeInTheDocument());
  });

  it("locked items render as '강제 ON' pill (not button)", async () => {
    fetchNotiSettingsMock.mockResolvedValueOnce({ settings: sampleItems });
    render(<NotiSettingsView />);
    await screen.findByText("회원가입 인증");

    const signupRow = screen.getByText("회원가입 인증").closest(".mp-row")!;
    expect(signupRow.querySelector(".value-pill")).toHaveTextContent("강제 ON");
    expect(signupRow.querySelector("button[aria-label*='회원가입 인증']")).toBeNull();
  });

  it("shows error on fetch failure", async () => {
    fetchNotiSettingsMock.mockRejectedValueOnce(new Error("알림 설정을 불러오지 못했어요."));
    render(<NotiSettingsView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("알림 설정을 불러오지 못했어요.");
  });
});
