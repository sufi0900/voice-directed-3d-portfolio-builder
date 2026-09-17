import { describe, expect, it, vi } from "vitest";
import { previewSectionId, scrollPreviewContainer } from "./preview-navigation";

describe("Studio preview navigation", () => {
  it("maps education editing to the shared experience and education section", () => {
    expect(previewSectionId({ section: "education" })).toBe("experience");
    expect(previewSectionId({ section: "about" })).toBe("about");
    expect(previewSectionId({ section: "site pages", itemId: "about-page" })).toBeUndefined();
  });

  it("scrolls only the preview container to a selected homepage section", () => {
    const scrollTo = vi.fn();
    const destination = { getBoundingClientRect: () => ({ top: 620 }) };
    const container = { scrollTop: 140, scrollTo, querySelector: vi.fn(() => destination), getBoundingClientRect: () => ({ top: 80 }) } as unknown as HTMLElement;
    scrollPreviewContainer(container, { section: "about" }, "auto");
    expect(container.querySelector).toHaveBeenCalledWith("#about");
    expect(scrollTo).toHaveBeenCalledWith({ top: 636, behavior: "auto" });
  });

  it("returns the preview container to the homepage top", () => {
    const scrollTo = vi.fn();
    const container = { scrollTo, querySelector: vi.fn() } as unknown as HTMLElement;
    scrollPreviewContainer(container, { section: "hero" }, "auto");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    expect(container.querySelector).not.toHaveBeenCalled();
  });
});
