import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as Icons from "../icons";

const ICON_NAMES = [
  "Search", "Bell", "ChevronDown", "ChevronRight", "ArrowRight", "ArrowLeft",
  "Plus", "Check", "Sparkle", "FileEdit", "Briefcase", "Calendar", "Target",
  "Layers", "Building", "Compass", "Folder", "Move", "Code", "Server",
  "Cloud", "Gear", "Layout", "Dots", "Link", "Edit", "Lock", "Refresh",
  "Save", "Download",
] as const;

describe("ui/icons — 전역 Ico 카탈로그", () => {
  it.each(ICON_NAMES)("%s 아이콘이 export 되어 있고 SVG 를 render 한다", (name) => {
    const Icon = (Icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
    expect(Icon).toBeDefined();
    const { container } = render(<Icon size={20} className="x" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("class")).toBe("x");
  });
});
