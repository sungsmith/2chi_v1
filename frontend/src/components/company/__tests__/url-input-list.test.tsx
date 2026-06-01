import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UrlInputList } from "../url-input-list";

describe("UrlInputList", () => {
  test("빈 배열이면 빈 입력 행 1개 표시", () => {
    render(<UrlInputList urls={[]} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("https://example.com/about")).toBeInTheDocument();
  });

  test("입력 시 onChange 가 비어있지 않은 값 배열로 호출", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<UrlInputList urls={[]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("https://example.com/about"), "h");
    expect(onChange).toHaveBeenLastCalledWith(["h"]);
  });

  test("max 도달 시 추가 버튼 비활성", () => {
    const five = ["a", "b", "c", "d", "e"];
    render(<UrlInputList urls={five} onChange={vi.fn()} max={5} />);
    expect(screen.getByRole("button", { name: /URL 추가/ })).toBeDisabled();
  });

  test("추가 버튼 클릭 시 onChange 에 빈 행 추가", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<UrlInputList urls={["https://a.com"]} onChange={onChange} max={5} />);
    await user.click(screen.getByRole("button", { name: /URL 추가/ }));
    expect(onChange).toHaveBeenCalledWith(["https://a.com", ""]);
  });
});
