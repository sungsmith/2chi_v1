import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApplicationEditModal } from "../application-edit-modal";

vi.mock("@/lib/api/application", () => ({
  fetchApplication: vi.fn(),
  patchApplication: vi.fn(),
  deleteApplication: vi.fn(),
  createEvent: vi.fn(),
  patchEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

import { fetchApplication, patchApplication, createEvent, deleteEvent } from "@/lib/api/application";

const APP = {
  id: 1, postingId: 10, company: "(주)테크", role: "백엔드",
  currentStage: "DOC_SUBMITTED", currentResult: "IN_PROGRESS",
  memo: "메모", variantsCount: 0,
  events: [
    { id: 100, applicationId: 1, type: "DOC_DEADLINE", eventDate: "2026-06-30",
      eventTime: null, memo: null, createdAt: "", updatedAt: "" },
  ],
  createdAt: "", updatedAt: "",
};

describe("ApplicationEditModal", () => {
  beforeEach(() => {
    vi.mocked(fetchApplication).mockResolvedValue(APP as never);
  });

  it("저장 시 patchApplication 호출", async () => {
    vi.mocked(patchApplication).mockResolvedValue(APP as never);
    const onChanged = vi.fn();
    render(<ApplicationEditModal applicationId={1} onClose={vi.fn()} onChanged={onChanged} />);
    await screen.findByDisplayValue("(주)테크");
    fireEvent.change(screen.getByDisplayValue("(주)테크"), { target: { value: "(주)신규" } });
    fireEvent.click(screen.getByText("저장"));
    await waitFor(() => expect(patchApplication).toHaveBeenCalledWith(1, expect.objectContaining({ company: "(주)신규" })));
    expect(onChanged).toHaveBeenCalled();
  });

  it("신규 일정 추가 시 createEvent 호출", async () => {
    vi.mocked(createEvent).mockResolvedValue({ id: 200, applicationId: 1, type: "FIRST_INTERVIEW",
      eventDate: "2026-07-15", eventTime: null, memo: null, createdAt: "", updatedAt: "" });
    render(<ApplicationEditModal applicationId={1} onClose={vi.fn()} onChanged={vi.fn()} />);
    await screen.findByDisplayValue("(주)테크");
    fireEvent.change(screen.getByLabelText("일자"), { target: { value: "2026-07-15" } });
    fireEvent.click(screen.getByText("+ 일정 추가"));
    await waitFor(() => expect(createEvent).toHaveBeenCalledWith(1, expect.objectContaining({ eventDate: "2026-07-15" })));
  });

  it("일정 삭제 시 deleteEvent 호출", async () => {
    vi.mocked(deleteEvent).mockResolvedValue();
    render(<ApplicationEditModal applicationId={1} onClose={vi.fn()} onChanged={vi.fn()} />);
    await screen.findByText("2026-06-30");
    fireEvent.click(screen.getByText("삭제"));
    await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith(100));
  });
});
