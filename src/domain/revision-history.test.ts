import { describe, expect, it } from "vitest";
import { changedRevisionFields, revisionSummary } from "./revision-history";
import { DEFAULT_SITE_DOCUMENT } from "./site-document";

describe("revision history summaries", () => {
  it("creates a safe visual summary without provenance contents", () => {
    expect(revisionSummary(DEFAULT_SITE_DOCUMENT)).toEqual({ name: "Sufian Mustafa", role: "AI-Augmented Web Creator", accent: "cyan", background: "midnight", alignment: "left", preset: "cosmic", motion: "calm", skills: 5 });
  });

  it("identifies fields that visibly changed", () => {
    const newer = { ...DEFAULT_SITE_DOCUMENT, design: { ...DEFAULT_SITE_DOCUMENT.design, accent: "violet" as const }, scene: { ...DEFAULT_SITE_DOCUMENT.scene, motion: "dynamic" as const } };
    expect(changedRevisionFields(DEFAULT_SITE_DOCUMENT, newer)).toEqual(["accent", "motion"]);
  });
});
