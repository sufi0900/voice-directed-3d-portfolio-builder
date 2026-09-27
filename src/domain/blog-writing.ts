import { z } from "zod";
import type { SiteDocument } from "./site-document";
import { legacyRichDocument } from "./legacy-rich-document";
import type { RichNode } from "./rich-document";
import type { SiteCommand } from "./commands";

export const blogProposalSchema = z.object({
  introduction: z.string().trim().min(30).max(900),
  sections: z.array(z.object({ heading: z.string().trim().min(3).max(140), body: z.string().trim().min(40).max(1300) })).min(1).max(5),
  conclusion: z.string().trim().min(20).max(900),
  excerpt: z.string().trim().min(20).max(320),
  seoTitle: z.string().trim().min(10).max(70),
  seoDescription: z.string().trim().min(40).max(170),
  questions: z.array(z.string().trim().min(5).max(180)).max(4).default([]),
});
export type BlogProposal = z.infer<typeof blogProposalSchema>;
type BlogPost = SiteDocument["publishing"]["posts"][number];

/** A proposal must be accepted before it becomes an editor command. Existing copy and media survive. */
export function buildBlogWritingCommand(site: SiteDocument, post: BlogPost, proposal: BlogProposal): SiteCommand {
  const existing = post.richContent ?? legacyRichDocument(post, site);
  const additions: RichNode[] = [
    { type: "paragraph", content: [{ type: "text", text: proposal.introduction }] },
    ...proposal.sections.flatMap((section): RichNode[] => [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: section.heading }] },
      { type: "paragraph", content: [{ type: "text", text: section.body }] },
    ]),
    { type: "paragraph", content: [{ type: "text", text: proposal.conclusion }] },
  ];
  const blocks: BlogPost["blocks"] = additions.map((node) => ({
    id: crypto.randomUUID(), type: node.type === "heading" ? "heading" : "paragraph",
    text: node.content?.[0]?.text ?? "", headingLevel: "h2", items: [], mediaId: "",
  }));
  if (post.blocks.length + blocks.length > 200 || (existing.content?.length ?? 0) + additions.length > 200) throw new Error("This article has too many content sections. Shorten it before adding another draft.");
  return {
    type: "publishing.applyBlogDraft", itemId: post.id,
    expectedItemSnapshot: JSON.stringify(post),
    richContent: { type: "doc", content: [...(existing.content ?? []), ...additions] },
    blocks: [...post.blocks, ...blocks],
    excerpt: post.excerpt || proposal.excerpt,
    seoTitle: post.seoTitle || proposal.seoTitle,
    seoDescription: post.seoDescription || proposal.seoDescription,
  };
}
