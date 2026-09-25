import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateSiteDocument } from "@/domain/site-document";
import { VisitorKnowledge } from "@/features/studio/visitor-knowledge";
import { GptConnection } from "@/features/studio/gpt-connection";

export default async function ProjectSettings({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await db.from("projects").select("id,name,document,revision,variant_of_project_id").eq("id", projectId).eq("owner_id", user.id).maybeSingle();
  if (!data) notFound();
  const document = validateSiteDocument(data.document);
  return <main className="flow-page wide project-settings-page"><header className="flow-nav"><Link href="/projects">← My projects</Link><strong>VOXFOLIO</strong><Link href={`/studio/${projectId}`}>Open Studio</Link></header>
    <div className="dashboard-heading"><div><p className="eyebrow">PORTFOLIO SETTINGS</p><h1>{data.name}</h1><p>Manage external connections and the assistant shown on your public portfolio.</p></div></div>
    <div className="settings-grid"><section className="settings-card"><GptConnection projectId={projectId} /></section>
    {!data.variant_of_project_id && <section className="settings-card"><VisitorKnowledge projectId={projectId} initialDocument={{ ...document, revision: data.revision }} /></section>}</div>
  </main>;
}
