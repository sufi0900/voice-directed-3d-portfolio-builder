import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { validateSiteDocument } from "@/domain/site-document";
import { PublicCaseStudy } from "@/features/public/public-case-study";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function caseStudy(slug: string, projectSlug: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("project_publications").select("document,revision").eq("slug", slug).is("superseded_at", null).maybeSingle();
  if (!data) return null;
  const document = validateSiteDocument(data.document);
  const project = document.content.projects.find((item) => item.caseStudySlug === projectSlug);
  return project ? { document: { ...document, revision: data.revision }, project } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; projectSlug: string }> }): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  const item = await caseStudy(slug, projectSlug);
  if (!item) return { title: "Case study not found — Voxfolio" };
  const cover = item.project.mediaIds.map((id) => item.document.media.assets.find((asset) => asset.id === id)).find(Boolean);
  return { title: `${item.project.title} — ${item.document.identity.name}`, description: item.project.summary || item.project.outcome || item.document.identity.intro, openGraph: cover ? { images: [{ url: cover.url, alt: cover.alt }] } : undefined };
}

export default async function ProjectCaseStudyPage({ params }: { params: Promise<{ slug: string; projectSlug: string }> }) {
  const { slug, projectSlug } = await params;
  const item = await caseStudy(slug, projectSlug);
  if (!item) notFound();
  return <PublicCaseStudy document={item.document} portfolioSlug={slug} project={item.project} />;
}
