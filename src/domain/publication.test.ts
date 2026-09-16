import { describe, expect, it } from "vitest";
import { normalizePublicationSlug, publicationSlugSchema, publishRequestSchema } from "./publication";

describe("portfolio publication boundaries", () => {
  it("normalizes project names into safe public slugs", () => {
    expect(normalizePublicationSlug(" Sufian — Growth Systems Portfolio! ")).toBe("sufian-growth-systems-portfolio");
  });

  it("rejects unsafe, ambiguous, and undersized slugs", () => {
    expect(publicationSlugSchema.safeParse("ab").success).toBe(false);
    expect(publicationSlugSchema.safeParse("unsafe/path").success).toBe(false);
    expect(publicationSlugSchema.safeParse("double--hyphen").success).toBe(false);
  });

  it("requires an exact nonnegative draft revision", () => {
    expect(publishRequestSchema.safeParse({ slug: "sufian-portfolio", expectedRevision: 12 }).success).toBe(true);
    expect(publishRequestSchema.safeParse({ slug: "sufian-portfolio", expectedRevision: -1 }).success).toBe(false);
  });
});
