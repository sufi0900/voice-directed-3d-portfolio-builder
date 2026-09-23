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
  if (parsed.opportunity.status !== "canonical" && parsed.opportunity.visibility !== "public") return null;
  return { ...data, document: { ...parsed, revision: data.revision } };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await publication(slug);
  if (!item) return { title: "Portfolio not found — Voxfolio" };
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const isPrivateVariant = item.document.opportunity.status !== "canonical" && item.document.opportunity.visibility !== "public";
  return {
    title: `${item.document.identity.name} — ${item.document.identity.role}`,
    description: item.document.identity.intro,
    icons: item.document.media.headshotUrl ? { icon: item.document.media.headshotUrl } : undefined,
    alternates: { canonical: `${base}/p/${slug}` },
    robots: isPrivateVariant ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title: `${item.document.identity.name} — ${item.document.identity.role}`, description: item.document.identity.intro, url: `${base}/p/${slug}`, images: [{ url: `${base}/p/${slug}/opengraph-image`, alt: `${item.document.identity.name} portfolio preview` }] },
  };
}

export default async function PublicPortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await publication(slug);
  if (!item) notFound();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const sameAs = item.document.content.contact.socials.map((social) => social.url);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: item.document.identity.name,
    jobTitle: item.document.identity.role,
    description: item.document.identity.intro,
    url: `${base}/p/${slug}`,
    ...(sameAs.length ? { sameAs } : {}),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><PublicPortfolio document={item.document} slug={slug} />;</>
}
