import { describe, it, expect } from "vitest";
import { notificationPresentation } from "@/lib/utils/notification-presentation";

describe("notificationPresentation", () => {
  it("WELCOME → Sparkle/mint", () => {
    expect(notificationPresentation("WELCOME")).toEqual({ icon: "Sparkle", tone: "mint" });
  });

  it("미지정 타입 → FALLBACK(Bell/default)", () => {
    expect(notificationPresentation("UNKNOWN_TYPE")).toEqual({ icon: "Bell", tone: "default" });
  });
});
