import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteAllConfirmModal } from "../delete-all-confirm-modal";

const deleteAllMock = vi.fn();
vi.mock("@/lib/api/notification", () => ({
  deleteAllNotifications: (...args: unknown[]) => deleteAllMock(...args),
}));

beforeEach(() => {
  deleteAllMock.mockReset();
});

describe("DeleteAllConfirmModal", () => {
  it("calls deleteAllNotifications and onSuccess on confirm", async () => {
    deleteAllMock.mockResolvedValueOnce(undefined);
    const onSuccess = vi.fn();
    render(<DeleteAllConfirmModal onClose={vi.fn()} onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole("button", { name: /전체 삭제/ }));

    await waitFor(() => expect(deleteAllMock).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows error message when API fails", async () => {
    deleteAllMock.mockRejectedValueOnce(new Error("전체 삭제에 실패했어요."));
    const onSuccess = vi.fn();
    render(<DeleteAllConfirmModal onClose={vi.fn()} onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole("button", { name: /전체 삭제/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("전체 삭제에 실패했어요.");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("cancel button calls onClose", async () => {
    const onClose = vi.fn();
    render(<DeleteAllConfirmModal onClose={onClose} onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalled();
    expect(deleteAllMock).not.toHaveBeenCalled();
  });

  it("backdrop click calls onClose", async () => {
    const onClose = vi.fn();
    const { container } = render(<DeleteAllConfirmModal onClose={onClose} onSuccess={vi.fn()} />);
    const backdrop = container.querySelector(".pf-modal-backdrop") as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
