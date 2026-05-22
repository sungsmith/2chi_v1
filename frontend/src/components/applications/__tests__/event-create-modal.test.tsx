import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EventCreateModal } from "../event-create-modal";

vi.mock("@/lib/api/application", () => ({
  createEvent: vi.fn(),
}));

import { createEvent } from "@/lib/api/application";

describe("EventCreateModal", () => {
  it("apps 비어있을 때 안내 메시지 + 닫기", () => {
    const onClose = vi.fn();
    render(<EventCreateModal apps={[]} onClose={onClose} onCreated={vi.fn()} />);
    expect(screen.getByText(/지원이 없어요/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("닫기"));
    expect(onClose).toHaveBeenCalled();
  });

  it("추가 버튼 클릭 시 createEvent 호출", async () => {
    vi.mocked(createEvent).mockResolvedValue({
      id: 1, applicationId: 1, type: "FIRST_INTERVIEW",
      eventDate: "2026-05-20", eventTime: null, memo: null, createdAt: "", updatedAt: "",
    });
    render(<EventCreateModal
      apps={[{
        id: 1, postingId: 10, company: "(주)테크", role: "백엔드",
        currentStage: "DOC_SUBMITTED", currentResult: "IN_PROGRESS",
        variantsCount: 0, nextEvent: null, updatedAt: "",
      }]}
      initialDate="2026-05-20"
      onClose={vi.fn()} onCreated={vi.fn()}
    />);
    fireEvent.click(screen.getByText("추가"));
    await waitFor(() => expect(createEvent).toHaveBeenCalledWith(1, expect.objectContaining({ eventDate: "2026-05-20" })));
  });
});
