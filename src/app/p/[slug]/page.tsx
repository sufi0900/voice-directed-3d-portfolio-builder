import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPortfolio } from "@/features/public/public-portfolio";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateSiteDocument } from "@/domain/site-document";

async function publication(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("project_publications").select("document,revision,published_at").eq("slug", slug).is("superseded_at", null).maybeSingle();
  if (!data) return null;
  const parsed = validateSiteDocument(data.document);
  return { ...data, document: { ...parsed, revision: data.revision } };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await publication(slug);
  if (!item) return { title: "Portfolio not found — Voxfolio" };
  return { title: `${item.document.identity.name} — ${item.document.identity.role}`, description: item.document.identity.intro, icons: item.document.media.headshotUrl ? { icon: item.document.media.headshotUrl } : undefined };
}

export default async function PublicPortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await publication(slug);
  if (!item) notFound();
  return <PublicPortfolio document={item.document} />;
}
