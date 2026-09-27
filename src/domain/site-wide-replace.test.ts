import { describe, expect, it } from "vitest";
import { applySiteCommand } from "./commands";
import { DEFAULT_SITE_DOCUMENT } from "./site-document";
import { previewSiteWideReplace } from "./site-wide-replace";

describe("reviewed site-wide replacement", () => {
  it("updates visible rich copy and mirrored blocks atomically without touching links, slugs or media", () => {
    const document = structuredClone(DEFAULT_SITE_DOCUMENT);
    document.identity.intro = "I write high quality content.";
    document.content.about.body = "I write high quality content.";
    document.publishing.posts.push({ id: "article", title: "My article", slug: "high-quality-content", seoTitle: "", seoDescription: "", coverMediaId: "", status: "draft", publishedAt: null, excerpt: "", tags: [],
      blocks: [{ id: "b", type: "paragraph", text: "I write high quality content.", items: [], mediaId: "", headingLevel: "h2" }],
      richContent: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "I write high quality content.", marks: [{ type: "link", attrs: { href: "https://example.org/high quality content" } }] }] }] } });
    const preview = previewSiteWideReplace(document, "high quality content", "high quality SEO content");
    expect(preview.occurrences).toBe(3);
    expect(preview.locations).toHaveLength(3);
    expect(document.identity.intro).toContain("high quality content");
    const updated = applySiteCommand(document, { type: "voice.replaceText", from: "high quality content", to: "high quality SEO content", expectedRevision: document.revision });
    expect(updated.identity.intro).toContain("high quality SEO content");
    expect(updated.content.about.body).toContain("high quality SEO content");
    expect(updated.publishing.posts[0].blocks[0].text).toContain("high quality SEO content");
    expect(updated.publishing.posts[0].richContent?.content?.[0].content?.[0].text).toContain("high quality SEO content");
    expect(updated.publishing.posts[0].richContent?.content?.[0].content?.[0].marks?.[0].attrs?.href).toContain("high quality content");
    expect(updated.publishing.posts[0].slug).toBe("high-quality-content");
    expect(updated.publishing.posts[0].status).toBe("draft");
    expect(updated.revision).toBe(document.revision + 1);
    expect(() => applySiteCommand(updated, { type: "voice.replaceText", from: "high quality content", to: "high quality SEO content", expectedRevision: document.revision })).toThrow("changed since");
  });
});
