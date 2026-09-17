import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProjectsIndex } from "@/features/public/public-projects-index";
import { getPublicationSnapshot } from "@/lib/publication-snapshot";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await getPublicationSnapshot(slug);
  return snapshot ? { title: `Projects — ${snapshot.document.identity.name}`, description: `Projects and case studies by ${snapshot.document.identity.name}.` } : { title: "Projects not found — Voxfolio" };
}

export default async function ProjectsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snapshot = await getPublicationSnapshot(slug);
  if (!snapshot || !snapshot.document.content.projects.length) notFound();
  return <PublicProjectsIndex document={snapshot.document} portfolioSlug={slug} />;
}
