import { describe, expect, it } from "vitest";
import { buildGuidedDocument, PORTFOLIO_TEMPLATES } from "./templates";
import { validateSiteDocument } from "./site-document";

describe("portfolio templates", () => {
  it("keeps every starter template schema-valid", () => {
    for (const template of PORTFOLIO_TEMPLATES) expect(validateSiteDocument(template.document)).toEqual(template.document);
  });

  it("grounds guided creation in the supplied professional facts", () => {
    const document = buildGuidedDocument({ name: "Amina Khan", role: "Product designer", intro: "I design accessible financial tools.", style: "minimal", projectId: "project-1" });
    expect(document.identity).toMatchObject({ name: "Amina Khan", role: "Product designer", intro: "I design accessible financial tools." });
    expect(document.projectId).toBe("project-1");
    expect(document.scene.preset).toBe("minimal");
  });

  it("uses only explicitly approved CV facts and preserves their provenance", () => {
    const document = buildGuidedDocument({
      name: "Manual Name",
      role: "Manual Role",
      intro: "Manual introduction.",
      style: "technical",
      projectId: "project-cv",
      cv: {
        sourceId: "source-1",
        fileName: "amina-cv.pdf",
        mediaType: "application/pdf",
        importedAt: "2026-09-15T00:00:00.000Z",
        originalStored: false,
        approvedFacts: [
          { id: "fact-1", kind: "name", value: "Amina Khan", sourceExcerpt: "Amina Khan" },
          { id: "fact-2", kind: "role", value: "Product Designer", sourceExcerpt: "Product Designer" },
        ],
      },
    });
    expect(document.identity).toMatchObject({ name: "Amina Khan", role: "Product Designer", intro: "Manual introduction." });
    expect(document.provenance?.cv?.originalStored).toBe(false);
    expect(document.provenance?.cv?.approvedFacts).toHaveLength(2);
  });
});
