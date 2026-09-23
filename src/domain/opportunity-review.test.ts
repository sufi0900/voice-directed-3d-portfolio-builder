import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_DOCUMENT } from "./site-document";
import { reviewOpportunity } from "./opportunity-review";

describe("opportunity review", () => {
  it("requires a title, audience, substantive brief, and selected evidence", () => {
    const document = structuredClone(DEFAULT_SITE_DOCUMENT);
    document.opportunity = {
      status: "draft",
      canonicalProjectId: "11111111-1111-4111-8111-111111111111",
      variantOfProjectId: "11111111-1111-4111-8111-111111111111",
      sourceRevision: 1,
      name: "Test Variant",
      type: "custom",
      title: "",
      brief: "short",
      audience: "",
      objective: "",
      deadline: null,
      confidentiality: "private",
      visibility: "private",
      slug: "",
      includedProjectIds: [],
      approvalNotes: "",
      heroOverride: "",
      projectOrder: [],
      sourceSnapshot: {
        name: document.identity.name,
        role: document.identity.role,
        intro: document.identity.intro,
        aboutHeading: document.content.about.heading,
        aboutBody: document.content.about.body,
        projectIds: document.content.projects.map((item) => item.id),
      },
    };
    expect(reviewOpportunity(document).ready).toBe(false);
    document.opportunity.title = "AI product-builder opportunity";
    document.opportunity.audience = "Hiring team";
    document.opportunity.brief = "Emphasise the approved product-system evidence for this focused opportunity.";
    document.opportunity.includedProjectIds = [document.content.projects[0].id];
    expect(reviewOpportunity(document).ready).toBe(true);
  });
});
