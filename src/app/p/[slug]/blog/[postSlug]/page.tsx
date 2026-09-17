import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicContentPage } from "@/features/public/public-content";
import { getPublicationSnapshot } from "@/lib/publication-snapshot";

async function post(slug: string, postSlug: string) {
  const snapshot = await getPublicationSnapshot(slug); if (!snapshot) return null;
  const item = snapshot.document.publishing.posts.find((candidate) => candidate.slug === postSlug && candidate.status === "published");
  return item ? { ...snapshot, item } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; postSlug: string }> }): Promise<Metadata> {
  const { slug, postSlug } = await params; const result = await post(slug, postSlug);
  if (!result) return { title: "Article not found — Voxfolio" };
  const cover = result.document.media.assets.find((asset) => asset.id === result.item.coverMediaId);
  return { title: result.item.seoTitle || `${result.item.title} — ${result.document.identity.name}`, description: result.item.seoDescription || result.item.excerpt || result.document.identity.intro, openGraph: cover ? { type: "article", images: [{ url: cover.url, alt: cover.alt }] } : { type: "article" } };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; postSlug: string }> }) {
  const { slug, postSlug } = await params; const result = await post(slug, postSlug); if (!result) notFound();
  return <PublicContentPage document={result.document} portfolioSlug={slug} item={result.item} kind="post" />;
}
