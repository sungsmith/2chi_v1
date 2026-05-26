import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SocialView } from "../social-view";
import { SOCIAL_MOCK } from "@/lib/mock/mypage";

describe("SocialView", () => {
  it("displays all 4 providers", () => {
    render(<SocialView connections={SOCIAL_MOCK} />);
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("카카오")).toBeInTheDocument();
    expect(screen.getByText("네이버")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });

  it("shows email/id for connected providers", () => {
    render(<SocialView connections={SOCIAL_MOCK} />);
    expect(screen.getByText(/somi\.kim@gmail\.com/)).toBeInTheDocument();
    expect(screen.getByText(/somi-kim/)).toBeInTheDocument();
  });
});
