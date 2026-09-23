import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_DOCUMENT, validateSiteDocument } from "./site-document";
import { localOpportunityPlan, validateOpportunityPlan } from "./opportunity-plan";

const variant = validateSiteDocument({ ...DEFAULT_SITE_DOCUMENT, opportunity: { ...DEFAULT_SITE_DOCUMENT.opportunity, status: "draft", canonicalProjectId: "11111111-1111-4111-8111-111111111111", brief: "Next.js AI product implementation" } });

describe("evidence-aware opportunity planning", () => {
  it("only proposes existing matching projects without a provider", () => {
    const plan = localOpportunityPlan(variant);
    expect(plan.proposals[0]?.evidenceIds).toContain("project:project-1");
    expect(validateOpportunityPlan(plan, variant)).toEqual(plan);
  });
  it("rejects fabricated evidence and unsupported project references", () => {
    expect(() => validateOpportunityPlan({ proposals: [{ target: "hero_intro", value: "I invented a role", evidenceIds: ["cv:missing"], rationale: "claim" }], warnings: [] }, variant)).toThrow("evidence");
    expect(() => validateOpportunityPlan({ proposals: [{ target: "projects", value: ["missing"], evidenceIds: ["project:project-1"], rationale: "claim" }], warnings: [] }, variant)).toThrow();
  });
  it("accepts only supplied approved memory identifiers and still validates proposed commands", () => {
    const proposal = { proposals: [{ target: "hero_intro", value: "Evidence-based wording", evidenceIds: ["memory:approved"], rationale: "Owner-approved fact" }], warnings: [] };
    expect(() => validateOpportunityPlan(proposal, variant)).toThrow("evidence");
    expect(validateOpportunityPlan(proposal, variant, [{ id: "memory:approved", text: "Verified professional fact" }])).toEqual(proposal);
  });
  it("does not plan changes to the canonical portfolio", () => {
    expect(() => validateOpportunityPlan({ proposals: [], warnings: [] }, DEFAULT_SITE_DOCUMENT)).toThrow("variant");
  });
});
