import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { UpcomingPanel } from "../upcoming-panel";

vi.mock("@/lib/api/application", () => ({
  fetchEvents: vi.fn(),
}));

import { fetchEvents } from "@/lib/api/application";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe("UpcomingPanel", () => {
  beforeEach(() => vi.mocked(fetchEvents).mockReset());

  it("mount 시 fetchEvents 호출 (오늘 ~ +7일)", async () => {
    vi.mocked(fetchEvents).mockResolvedValue([]);
    render(<UpcomingPanel />);
    await waitFor(() => expect(fetchEvents).toHaveBeenCalled());
    const [from, to] = vi.mocked(fetchEvents).mock.calls[0];
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const diff = (new Date(to).getTime() - new Date(from).getTime()) / 86400000;
    expect(diff).toBe(7);
  });

  it("빈 응답 시 안내 메시지 렌더", async () => {
    vi.mocked(fetchEvents).mockResolvedValue([]);
    render(<UpcomingPanel />);
    expect(await screen.findByText(/다가오는 일정이 없어요/)).toBeInTheDocument();
  });
});
