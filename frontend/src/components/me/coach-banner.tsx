"use client";

import { Banner } from "@/components/ui/banner";

type Props = { onDismiss?: () => void };

export function CoachBanner({ onDismiss }: Props) {
  return (
    <Banner variant="info" dismissible onDismiss={onDismiss}>
      <b>PRAR 구조로 정리하면 자소서에 그대로 다시 쓸 수 있어요.</b>{" "}
      문제 · 원인 · 접근 · 결과 네 칸으로 나눠 채워보세요.
    </Banner>
  );
}
