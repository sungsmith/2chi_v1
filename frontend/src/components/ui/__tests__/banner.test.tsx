import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Banner } from "../banner";

describe("Banner", () => {
  it("renders with default variant=info", () => {
    const { container } = render(<Banner>안내 메시지</Banner>);
    const root = container.querySelector(".banner");
    expect(root?.className).toContain("info");
  });

  it("renders variant=warn / variant=update", () => {
    const { container, rerender } = render(<Banner variant="warn">경고</Banner>);
    expect(container.querySelector(".banner")?.className).toContain("warn");
    rerender(<Banner variant="update">업데이트</Banner>);
    expect(container.querySelector(".banner")?.className).toContain("update");
  });

  it("shows action button + invokes onAction", () => {
    const onAction = vi.fn();
    render(<Banner actionLabel="자세히" onAction={onAction}>본문</Banner>);
    fireEvent.click(screen.getByText("자세히"));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("shows dismiss button + invokes onDismiss", () => {
    const onDismiss = vi.fn();
    render(<Banner dismissible onDismiss={onDismiss}>본문</Banner>);
    fireEvent.click(screen.getByLabelText("닫기"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
