import { describe, expect, it } from "vitest";
import { deriveImageAlt } from "./media";

describe("portfolio media accessibility fallback", () => {
  it("uses supplied alternative text when present", () => {
    expect(deriveImageAlt("hero-photo.webp", "Sufian presenting a product demo")).toBe("Sufian presenting a product demo");
  });

  it("creates editable temporary text from a filename", () => {
    expect(deriveImageAlt("growth-systems_dashboard.png")).toBe("growth systems dashboard");
    expect(deriveImageAlt(".jpg")).toBe("Portfolio image");
  });
});
