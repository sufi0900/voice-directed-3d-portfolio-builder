import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { validateSiteDocument } from "@/domain/site-document";
import { projectsForPresentation } from "@/domain/opportunity";
import { PublicPortfolio } from "@/features/public/public-portfolio";
import { PublicProjectsIndex } from "@/features/public/public-projects-index";
import { PublicCaseStudy } from "@/features/public/public-case-study";
import { PublicBlogIndex, PublicContentPage } from "@/features/public/public-content";
import { OpportunityFeedback } from "@/features/public/opportunity-feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hashShareToken, validShareToken } from "@/domain/opportunity-share";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ token: string; path?: string[] }> };
const sharedDocument = cache(async (token: string) => {
  if (!validShareToken(token)) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("read_opportunity_share", { p_hash: hashShareToken(token) });
  if (error || !data?.[0]) return null;
  const document = validateSiteDocument(data[0].document);
  if (document.opportunity.status === "canonical" || document.opportunity.visibility !== "shared") return null;
  return { ...document, revision: data[0].revision };
});
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  return { title: await sharedDocument(token) ? "Private opportunity portfolio — Voxfolio" : "Share unavailable — Voxfolio", robots: { index: false, follow: false, noarchive: true }, referrer: "no-referrer" };
}
export default async function SharedOpportunityPage({ params }: Props) {
  const { token, path = [] } = await params;
  const document = await sharedDocument(token);
  if (!document) notFound();
  const basePath = `/s/${token}`;
  if (!path.length) return <><PublicPortfolio document={document} slug="" basePath={basePath} /><OpportunityFeedback token={token} /></>;
  if (path[0] === "projects") {
    if (path.length === 1) return <PublicProjectsIndex document={document} portfolioSlug="" basePath={basePath} />;
    const project = projectsForPresentation(document).find((item) => item.caseStudySlug === path[1]);
    if (path.length === 2 && project) return <PublicCaseStudy document={document} project={project} portfolioSlug="" basePath={basePath} />;
  }
  if (path[0] === "blog") {
    if (path.length === 1 && document.publishing.posts.some((post) => post.status === "published")) return <PublicBlogIndex document={document} portfolioSlug="" basePath={basePath} />;
    const post = document.publishing.posts.find((item) => item.slug === path[1] && item.status === "published");
    if (path.length === 2 && post) return <PublicContentPage document={document} portfolioSlug="" item={post} kind="post" basePath={basePath} />;
  }
  if (path[0] === "pages" && path.length === 2) {
    const page = document.publishing.pages.find((item) => item.slug === path[1] && item.status === "published");
    if (page) return <PublicContentPage document={document} portfolioSlug="" item={page} kind="page" basePath={basePath} />;
  }
  notFound();
}
