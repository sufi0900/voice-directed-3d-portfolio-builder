import type { SiteDocument } from "@/domain/site-document";

export type VisitorEvidence = { id: string; text: string; href?: string };
export function visitorEvidence(document: SiteDocument, slug: string): VisitorEvidence[] {
  const path = `/p/${slug}`;
  return [
    { id: "identity", text: `${document.identity.name} is ${document.identity.role}. ${document.identity.intro}` },
    ...document.visitor.facts.map((fact) => ({ id: `approved:${fact.id}`, text: fact.text })),
    { id: "about", text: `${document.content.about.heading}: ${document.content.about.body}`, href: `${path}#about` },
    ...document.skills.map((item) => ({ id: `skill:${item.id}`, text: `${document.identity.name} lists ${item.label} as a skill.`, href: `${path}#skills` })),
    ...document.content.experience.map((item) => ({ id: `experience:${item.id}`, text: `${item.role} at ${item.organization}: ${item.summary}`, href: `${path}#experience` })),
    ...document.content.projects.map((item) => ({ id: `project:${item.id}`, text: `${item.title}: ${item.summary}. ${item.challenge} ${item.approach} ${item.outcome}`.slice(0, 1300), href: item.caseStudySlug ? `${path}/projects/${item.caseStudySlug}` : `${path}/projects` })),
    ...document.publishing.pages.filter((item) => item.status === "published").map((item) => ({ id: `page:${item.id}`, text: `${item.title}: ${item.blocks.map((block) => block.text || block.items.join(" ")).join(" ")}`.slice(0, 1300), href: `${path}/pages/${item.slug}` })),
    ...document.publishing.posts.filter((item) => item.status === "published").map((item) => ({ id: `post:${item.id}`, text: `${item.title}: ${item.excerpt}. ${item.blocks.map((block) => block.text || block.items.join(" ")).join(" ")}`.slice(0, 1300), href: `${path}/blog/${item.slug}` })),
  ].filter((item) => item.text.trim().length > 12);
}

const common = new Set(["the", "and", "are", "for", "you", "what", "does", "have", "with", "about", "your", "their", "that", "this", "from", "tell", "more", "work", "know", "please", "could", "would", "show", "how", "when", "where"]);
export function matchVisitorEvidence(question: string, evidence: VisitorEvidence[]) {
  const terms = new Set((question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter((part) => !common.has(part)));
  if (!terms.size) return [];
  return evidence.map((item) => ({ item, score: [...terms].reduce((sum, term) => sum + (item.text.toLowerCase().includes(term) ? 1 : 0), 0) })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => item);
}
