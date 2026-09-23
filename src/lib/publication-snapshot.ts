import { validateSiteDocument } from "@/domain/site-document";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPublicationSnapshot(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("project_publications").select("document,revision,published_at").eq("slug", slug).is("superseded_at", null).maybeSingle();
  if (!data) return null;
  const document = validateSiteDocument(data.document);
  if (document.opportunity.status !== "canonical" && document.opportunity.visibility !== "public") return null;
  return { document: { ...document, revision: data.revision }, publishedAt: data.published_at };
}
