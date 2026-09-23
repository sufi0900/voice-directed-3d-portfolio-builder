import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_DOCUMENT } from "./site-document";
import { createOpportunityVariant } from "./opportunity-variant";
import { acceptSourceChanges, reviewSourceChanges } from "./opportunity-source-review";

const canonical = { ...DEFAULT_SITE_DOCUMENT, projectId: "f4ae831e-069e-4a37-8599-89dc0a0129da", revision: 7 };
const variant = createOpportunityVariant(canonical, { variantOfProjectId: canonical.projectId, name: "Client pitch", opportunityType: "freelance-proposal" });

describe("selective opportunity source review", () => {
  it("shows changed source copy and preserves independent opportunity edits", () => {
    const tailored = { ...variant, identity: { ...variant.identity, intro: "Tailored introduction" }, opportunity: { ...variant.opportunity, brief: "Pitch to the client", visibility: "shared" as const } };
    const source = { ...canonical, revision: 8, identity: { ...canonical.identity, role: "Updated role", intro: "New verified introduction" } };
    const diff = reviewSourceChanges(tailored, source);
    expect(diff.map((item) => item.key)).toEqual(["role", "intro"]);
    expect(diff.find((item) => item.key === "intro")?.tailored).toBe(true);
    const result = acceptSourceChanges(tailored, source, ["role"]);
    expect(result.identity.role).toBe("Updated role");
    expect(result.identity.intro).toBe("Tailored introduction");
    expect(result.opportunity.brief).toBe("Pitch to the client");
    expect(result.opportunity.visibility).toBe("shared");
    expect(result.opportunity.sourceRevision).toBe(8);
    expect(result.revision).toBe(tailored.revision + 1);
    expect(canonical.identity.role).not.toBe("Updated role");
  });

  it("rejects unknown, duplicate, or foreign source changes", () => {
    const source = { ...canonical, revision: 8, identity: { ...canonical.identity, role: "Changed role" } };
    expect(() => acceptSourceChanges(variant, source, ["role", "role"])).toThrow();
    expect(() => acceptSourceChanges(variant, source, ["project:unknown"])).toThrow();
    expect(() => reviewSourceChanges(variant, { ...source, projectId: crypto.randomUUID() })).toThrow();
  });

  it("adds a newly approved case study without selecting it or deleting existing work", () => {
    const original = canonical.content.projects[0];
    const additional = { ...original, id: crypto.randomUUID(), title: "New evidence" };
    const source = { ...canonical, revision: 8, content: { ...canonical.content, projects: [...canonical.content.projects, additional] } };
    const result = acceptSourceChanges(variant, source, [`project:${additional.id}`]);
    expect(result.content.projects.some((item) => item.id === additional.id)).toBe(true);
    expect(result.opportunity.includedProjectIds).not.toContain(additional.id);
    expect(result.content.projects.some((item) => item.id === original.id)).toBe(true);
  });

  it("carries a selected case study image into the variant media library", () => {
    const project = canonical.content.projects[0];
    const asset = { id: crypto.randomUUID(), url: "https://example.com/image.jpg", storagePath: "owner/source/library/image.jpg", alt: "Project preview", createdAt: new Date().toISOString() };
    const source = { ...canonical, revision: 8, content: { ...canonical.content, projects: [{ ...project, mediaIds: [asset.id] }] }, media: { ...canonical.media, assets: [asset] } };
    const result = acceptSourceChanges(variant, source, [`project:${project.id}`]);
    expect(result.media.assets).toContainEqual(asset);
    expect(result.content.projects[0].mediaIds).toEqual([asset.id]);
  });
});
