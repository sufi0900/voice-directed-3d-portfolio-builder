import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_DOCUMENT, type SiteDocument } from "./site-document";
import { opportunityAcceptance } from "./opportunity-acceptance";

function variant(overrides: Partial<SiteDocument["opportunity"]> = {}): SiteDocument {
  return {
    ...structuredClone(DEFAULT_SITE_DOCUMENT),
    projectId: "variant-project",
    opportunity: {
      ...structuredClone(DEFAULT_SITE_DOCUMENT.opportunity),
      status: "draft",
      canonicalProjectId: "00000000-0000-0000-0000-000000000001",
      variantOfProjectId: "00000000-0000-0000-0000-000000000001",
      title: "AssemblyAI submission",
      audience: "Hackathon judges",
      brief: "Show the governed voice editing workflow and evidence-backed delivery.",
      includedProjectIds: ["project-1"],
      visibility: "shared",
      ...overrides,
    },
  };
}

describe("V25 opportunity acceptance", () => {
  it("requires an independent variant, review, shared visibility, and current publication", () => {
    const document = variant();
    expect(opportunityAcceptance(document).ready).toBe(false);
    expect(opportunityAcceptance(document, { ...document, revision: document.revision }).ready).toBe(true);
  });

  it("rejects a stale or non-shared publication", () => {
    const document = variant();
    expect(opportunityAcceptance(document, { ...document, revision: document.revision - 1 }).ready).toBe(false);
    expect(opportunityAcceptance(document, { ...document, opportunity: { ...document.opportunity, visibility: "private" } }).ready).toBe(false);
  });

  it("does not mark a canonical portfolio deliverable", () => {
    const canonical = structuredClone(DEFAULT_SITE_DOCUMENT);
    expect(opportunityAcceptance(canonical, canonical).checks.find((check) => check.id === "variant")?.complete).toBe(false);
  });
});
