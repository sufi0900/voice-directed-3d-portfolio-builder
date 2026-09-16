import { notFound, redirect } from "next/navigation";
import { PortfolioStudio } from "@/features/studio/portfolio-studio";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateSiteDocument } from "@/domain/site-document";

export default async function SavedStudioPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("projects").select("name,document,revision").eq("id", projectId).single();
  if (!data) notFound();
  const { data: live } = await supabase.from("project_publications").select("slug,revision,published_at").eq("project_id", projectId).is("superseded_at", null).maybeSingle();
  const document = validateSiteDocument(data.document);
  return <PortfolioStudio initialDocument={{ ...document, revision: data.revision }} projectName={data.name} persistence="server" initialPublication={live ?? undefined} />;
}
