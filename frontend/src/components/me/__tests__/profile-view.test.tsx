import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProfileView } from "../profile-view";
import { PROFILE_MOCK } from "@/lib/mock/me";

describe("ProfileView", () => {
  it("renders 5 sub-sections with headings", () => {
    render(<ProfileView data={PROFILE_MOCK} />);
    expect(screen.getByText("기본정보")).toBeInTheDocument();
    expect(screen.getByText("학력")).toBeInTheDocument();
    expect(screen.getByText("자격증")).toBeInTheDocument();
    expect(screen.getByText(/경험.*대외활동/)).toBeInTheDocument();
    expect(screen.getByText("이력서")).toBeInTheDocument();
  });

  it("renders basic info fields", () => {
    render(<ProfileView data={PROFILE_MOCK} />);
    expect(screen.getByText("김소미")).toBeInTheDocument();
    expect(screen.getByText("somi.kim@example.com")).toBeInTheDocument();
    expect(screen.getByText("백엔드")).toBeInTheDocument();
  });

  it("renders cert list", () => {
    render(<ProfileView data={PROFILE_MOCK} />);
    expect(screen.getByText("정보처리기사")).toBeInTheDocument();
    expect(screen.getByText("SQLD")).toBeInTheDocument();
  });

  it("renders resume note when present", () => {
    render(<ProfileView data={PROFILE_MOCK} />);
    expect(screen.getByText("kim-somi-resume-v3.pdf")).toBeInTheDocument();
  });

  it("renders 이력서 empty state when resume is null", () => {
    render(<ProfileView data={{ ...PROFILE_MOCK, resume: null }} />);
    expect(screen.getByText(/아직 이력서가 없어요|이력서를 추가/i)).toBeInTheDocument();
  });
});
