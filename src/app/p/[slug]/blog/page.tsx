import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicBlogIndex } from "@/features/public/public-content";
import { getPublicationSnapshot } from "@/lib/publication-snapshot";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const snapshot = await getPublicationSnapshot(slug);
  return snapshot ? { title: `Journal — ${snapshot.document.identity.name}`, description: `Articles and field notes from ${snapshot.document.identity.name}.` } : { title: "Journal not found — Voxfolio" };
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const snapshot = await getPublicationSnapshot(slug);
  if (!snapshot || !snapshot.document.publishing.posts.some((post) => post.status === "published")) notFound();
  return <PublicBlogIndex document={snapshot.document} portfolioSlug={slug} />;
}
