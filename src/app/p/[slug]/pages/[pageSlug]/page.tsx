import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicContentPage } from "@/features/public/public-content";
import { getPublicationSnapshot } from "@/lib/publication-snapshot";

async function page(slug: string, pageSlug: string) {
  const snapshot = await getPublicationSnapshot(slug);
  if (!snapshot) return null;
  const item = snapshot.document.publishing.pages.find((candidate) => candidate.slug === pageSlug && candidate.status === "published");
  return item ? { ...snapshot, item } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; pageSlug: string }> }): Promise<Metadata> {
  const { slug, pageSlug } = await params; const result = await page(slug, pageSlug);
  if (!result) return { title: "Page not found — Voxfolio" };
  const cover = result.document.media.assets.find((asset) => asset.id === result.item.coverMediaId);
  return { title: result.item.seoTitle || `${result.item.title} — ${result.document.identity.name}`, description: result.item.seoDescription || result.document.identity.intro, openGraph: cover ? { images: [{ url: cover.url, alt: cover.alt }] } : undefined };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string; pageSlug: string }> }) {
  const { slug, pageSlug } = await params; const result = await page(slug, pageSlug); if (!result) notFound();
  return <PublicContentPage document={result.document} portfolioSlug={slug} item={result.item} kind="page" />;
}
