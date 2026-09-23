import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateSiteDocument } from "@/domain/site-document";
import { opportunityAcceptance } from "@/domain/opportunity-acceptance";

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: project } = await supabase.from("projects").select("id,document,revision").eq("id", projectId).eq("owner_id", user.id).maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const { data: publication } = await supabase.from("project_publications").select("document,revision").eq("project_id", projectId).is("superseded_at", null).maybeSingle();
  const document = validateSiteDocument(project.document);
  const publishedDocument = publication ? validateSiteDocument(publication.document) : undefined;
  return NextResponse.json({ ...opportunityAcceptance(document, publishedDocument), revision: project.revision, publicationRevision: publication?.revision ?? null }, { headers: { "Cache-Control": "no-store" } });
}
