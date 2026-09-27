import { describe, expect, it } from "vitest";
import { buildBlogWritingCommand, blogProposalSchema } from "./blog-writing";
import { applySiteCommand } from "./commands";
import { DEFAULT_SITE_DOCUMENT } from "./site-document";

const proposal = blogProposalSchema.parse({
  introduction: "These are observations drawn from a real review of my own work.",
  sections: [{ heading: "What I observed", body: "I checked the page structure and wrote down the problems I could actually confirm." }],
  conclusion: "These notes give me a starting point for a careful follow-up.",
  excerpt: "Notes from a review of my own page structure.",
  seoTitle: "Page structure notes from my review",
  seoDescription: "A short account of the page structure issues I observed and recorded during my own review.",
  questions: ["Which page did you inspect?"],
});

describe("reviewed blog drafting", () => {
  it("adds content atomically without changing publication status or replacing existing words", () => {
    const site = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "post", title: "Review notes", body: "My verified opening note." });
    const post = site.publishing.posts[0];
    const command = buildBlogWritingCommand(site, post, proposal);
    const next = applySiteCommand(site, command);
    expect(next.publishing.posts[0].status).toBe("draft");
    expect(next.publishing.posts[0].blocks[0].text).toBe("My verified opening note.");
    expect(next.publishing.posts[0].richContent?.content?.map(node => node.type)).toEqual(["paragraph", "paragraph", "heading", "paragraph", "paragraph"]);
    expect(next.publishing.posts[0].seoTitle).toBe(proposal.seoTitle);
    expect(site.publishing.posts[0].seoTitle).toBe("");
  });

  it("rejects a stale proposal when the owner edits the article before accepting it", () => {
    const site = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "post", title: "Review notes" });
    const command = buildBlogWritingCommand(site, site.publishing.posts[0], proposal);
    const updated = applySiteCommand(site, { type: "publishing.update", kind: "post", itemId: site.publishing.posts[0].id, field: "title", value: "Corrected title" });
    expect(() => applySiteCommand(updated, command)).toThrow(/changed while Vox was writing/);
    expect(updated.publishing.posts[0].blocks).toEqual([]);
  });
});
