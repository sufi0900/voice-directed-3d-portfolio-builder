import { describe, expect, it } from "vitest";
import { applySiteCommand } from "./commands";
import {
  createOpportunityVariant,
  isCanonicalDriftDetected,
  refreshVariantFromCanonical,
} from "./opportunity-variant";
import { DEFAULT_SITE_DOCUMENT } from "./site-document";

const CANONICAL_PROJECT_ID = "11111111-1111-4111-8111-111111111111";

describe("createOpportunityVariant", () => {
  it("builds an independent variant document that starts from approved canonical content", () => {
    const variant = createOpportunityVariant(DEFAULT_SITE_DOCUMENT, {
      variantOfProjectId: CANONICAL_PROJECT_ID,
      name: "AI Hackathon Submission",
      opportunityType: "hackathon-submission",
      audience: "AssemblyAI judges",
    });

    expect(variant.revision).toBe(0);
    expect(variant.content.projects).toEqual(DEFAULT_SITE_DOCUMENT.content.projects);
    expect(variant.identity).toEqual(DEFAULT_SITE_DOCUMENT.identity);
    expect(variant.opportunity).toMatchObject({
      variantOfProjectId: CANONICAL_PROJECT_ID,
      canonicalProjectId: CANONICAL_PROJECT_ID,
      sourceRevision: DEFAULT_SITE_DOCUMENT.revision,
      name: "AI Hackathon Submission",
      type: "hackathon-submission",
      audience: "AssemblyAI judges",
      status: "draft",
      confidentiality: "private",
    });
    expect(variant.opportunity?.slug).toBe("ai-hackathon-submission");
  });

  it("never mutates the canonical document", () => {
    const before = structuredClone(DEFAULT_SITE_DOCUMENT);
    createOpportunityVariant(DEFAULT_SITE_DOCUMENT, { variantOfProjectId: CANONICAL_PROJECT_ID, name: "Freelance pitch", opportunityType: "freelance-proposal" });
    expect(DEFAULT_SITE_DOCUMENT).toEqual(before);
  });

  it("de-duplicates the slug against existing opportunity slugs", () => {
    const variant = createOpportunityVariant(DEFAULT_SITE_DOCUMENT, {
      variantOfProjectId: CANONICAL_PROJECT_ID,
      name: "Freelance pitch",
      opportunityType: "freelance-proposal",
      existingSlugs: ["freelance-pitch", "freelance-pitch-2"],
    });
    expect(variant.opportunity?.slug).toBe("freelance-pitch-3");
  });

  it("copies pages into an independent draft so the variant remains usable", () => {
    const withPost = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "post", title: "Case study" });
    const variant = createOpportunityVariant(withPost, { variantOfProjectId: CANONICAL_PROJECT_ID, name: "Contract role", opportunityType: "contract-role" });
    expect(variant.publishing.pages).toEqual(withPost.publishing.pages);
    expect(variant.publishing.posts).toEqual(withPost.publishing.posts);
  });
});

describe("isCanonicalDriftDetected", () => {
  it("is false for a document that is not a variant", () => {
    expect(isCanonicalDriftDetected(DEFAULT_SITE_DOCUMENT, 5)).toBe(false);
  });

  it("is true once the canonical revision has moved ahead of the variant's source revision", () => {
    const variant = createOpportunityVariant(DEFAULT_SITE_DOCUMENT, { variantOfProjectId: CANONICAL_PROJECT_ID, name: "Partnership", opportunityType: "partnership" });
    expect(isCanonicalDriftDetected(variant, DEFAULT_SITE_DOCUMENT.revision)).toBe(false);
    expect(isCanonicalDriftDetected(variant, DEFAULT_SITE_DOCUMENT.revision + 1)).toBe(true);
  });
});

describe("refreshVariantFromCanonical", () => {
  it("replaces content from canonical while preserving the opportunity brief and variant identity", () => {
    const canonical = { ...DEFAULT_SITE_DOCUMENT, projectId: CANONICAL_PROJECT_ID };
    const variant = createOpportunityVariant(canonical, { variantOfProjectId: CANONICAL_PROJECT_ID, name: "Accelerator application", opportunityType: "accelerator-application", audience: "YC partners" });
    const updatedCanonical = applySiteCommand(canonical, { type: "identity.set", field: "intro", value: "Updated canonical introduction." });

    const refreshed = refreshVariantFromCanonical(variant, updatedCanonical);

    expect(refreshed.identity.intro).toBe("Updated canonical introduction.");
    expect(refreshed.projectId).toBe(variant.projectId);
    expect(refreshed.opportunity).toMatchObject({ name: "Accelerator application", audience: "YC partners", sourceRevision: updatedCanonical.revision });
    expect(refreshed.revision).toBe(variant.revision + 1);
  });

  it("drops stale project-order ids that no longer exist on canonical and appends any new ones", () => {
    const canonical = { ...DEFAULT_SITE_DOCUMENT, projectId: CANONICAL_PROJECT_ID };
    const variant = createOpportunityVariant(canonical, { variantOfProjectId: CANONICAL_PROJECT_ID, name: "Job application", opportunityType: "job-application" });
    const withNewProject = applySiteCommand(canonical, { type: "project.add", title: "New shipped project" });
    const originalProjectId = DEFAULT_SITE_DOCUMENT.content.projects[0].id;
    const removedOriginal = applySiteCommand(withNewProject, { type: "project.remove", itemId: originalProjectId });

    const refreshed = refreshVariantFromCanonical(variant, removedOriginal);

    expect(refreshed.opportunity?.projectOrder).not.toContain(originalProjectId);
    expect(refreshed.opportunity?.projectOrder).toEqual(removedOriginal.content.projects.map((project) => project.id));
  });

  it("throws when asked to refresh a document that has no opportunity brief (canonical status)", () => {
    expect(() => refreshVariantFromCanonical(DEFAULT_SITE_DOCUMENT, DEFAULT_SITE_DOCUMENT)).toThrow("not an opportunity variant");
  });
});
