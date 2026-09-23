import { PortfolioStudio } from "@/features/studio/portfolio-studio";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateSiteDocument } from "@/domain/site-document";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!hasSupabaseConfig) return <PortfolioStudio />;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <PortfolioStudio />;
  const { data: project } = await supabase.from("projects").select("id,name,document,revision").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!project) return <PortfolioStudio authenticated userEmail={user.email} />;
  const { data: live } = await supabase.from("project_publications").select("slug,revision,published_at,document").eq("project_id", project.id).is("superseded_at", null).maybeSingle();
  const document = validateSiteDocument(project.document);
  const publication = live ? { ...live, document: validateSiteDocument(live.document) } : undefined;
  return <PortfolioStudio initialDocument={{ ...document, revision: project.revision }} projectName={project.name} persistence="server" initialPublication={publication} authenticated userEmail={user.email} />;
}
