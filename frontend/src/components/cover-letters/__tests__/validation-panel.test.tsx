import { describe, expect, test, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { WriteValidationPanel } from "../write-validation-panel";

describe("WriteValidationPanel", () => {
  test("초기 렌더 — 글자수 + 키워드 표시", () => {
    render(
      <WriteValidationPanel
        userEdit="Spring Boot MSA Kafka 다 다뤘습니다."
        charLimit={500}
        postingKeywords={["Spring Boot", "MSA", "Kafka", "PostgreSQL"]}
      />
    );
    expect(screen.getByText(/JD 키워드/)).toBeInTheDocument();
  });

  test("debounce 후 매칭 키워드 갱신", async () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <WriteValidationPanel userEdit="" charLimit={100} postingKeywords={["A", "B", "C"]} />
      );
      rerender(<WriteValidationPanel userEdit="A B C 다 들어있음" charLimit={100} postingKeywords={["A", "B", "C"]} />);
      act(() => { vi.advanceTimersByTime(600); });
      expect(screen.getByText(/기준 3개 충족/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  test("AI 검증 v2 예정 플레이스홀더 패널 렌더", () => {
    render(<WriteValidationPanel userEdit="" charLimit={100} postingKeywords={[]} />);
    expect(screen.getByText(/AI 검증/)).toBeInTheDocument();
    expect(screen.getByText(/v2 예정/)).toBeInTheDocument();
  });

  test("매칭/보완 키워드 칩 렌더", async () => {
    vi.useFakeTimers();
    try {
      render(
        <WriteValidationPanel
          userEdit="Spring Boot MSA"
          charLimit={200}
          postingKeywords={["Spring Boot", "MSA", "Kafka"]}
        />
      );
      act(() => { vi.advanceTimersByTime(600); });
      expect(screen.getByText("Spring Boot")).toBeInTheDocument();
      expect(screen.getByText("MSA")).toBeInTheDocument();
      expect(screen.getByText("Kafka")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
