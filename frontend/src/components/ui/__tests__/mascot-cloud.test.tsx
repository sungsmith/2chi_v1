import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MascotCloud } from "../mascot-cloud";

describe("MascotCloud", () => {
  it("renders span with mascot-cloud class + size + expression", () => {
    const { container } = render(<MascotCloud size="md" expression="wave" />);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.className).toBe("mascot-cloud md wave");
    expect(span?.getAttribute("aria-hidden")).toBe("true");
  });

  it("defaults size=md expression=default", () => {
    const { container } = render(<MascotCloud />);
    expect(container.querySelector("span")?.className).toBe("mascot-cloud md default");
  });
});
