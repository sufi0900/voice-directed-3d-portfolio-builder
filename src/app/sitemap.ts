import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateSiteDocument } from "@/domain/site-document";
import { projectsForPresentation } from "@/domain/opportunity";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const urls: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/start`, changeFrequency: "monthly", priority: .8 },
  ];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("project_publications").select("slug,document,published_at").is("superseded_at", null).limit(1000);
  for (const record of data ?? []) {
    try {
      const document = validateSiteDocument(record.document);
      if (document.opportunity.status !== "canonical" && document.opportunity.visibility !== "public") continue;
      const root = `${base}/p/${record.slug}`;
      const lastModified = new Date(record.published_at);
      urls.push({ url: root, lastModified, changeFrequency: "monthly", priority: .7 });
      const presentedProjects = projectsForPresentation(document);
      if (presentedProjects.length) urls.push({ url: `${root}/projects`, lastModified, priority: .55 });
      for (const project of presentedProjects) if (project.caseStudySlug) urls.push({ url: `${root}/projects/${project.caseStudySlug}`, lastModified, priority: .5 });
      for (const page of document.publishing.pages) if (page.status === "published") urls.push({ url: `${root}/pages/${page.slug}`, lastModified, priority: .5 });
      const posts = document.publishing.posts.filter((post) => post.status === "published");
      if (posts.length) urls.push({ url: `${root}/blog`, lastModified, priority: .55 });
      for (const post of posts) urls.push({ url: `${root}/blog/${post.slug}`, lastModified, priority: .5 });
    } catch { /* A legacy or invalid publication must not break the complete sitemap. */ }
  }
  return urls;
}
