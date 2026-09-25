import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publishRequestSchema } from "@/domain/publication";
import { validateSiteDocument } from "@/domain/site-document";
import { reviewOpportunity } from "@/domain/opportunity-review";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const input = publishRequestSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Use 3–64 lowercase letters, numbers, and single hyphens for the public URL." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: project } = await supabase.from("projects").select("document,revision").eq("id", projectId).eq("owner_id", user.id).single();
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  if (project.revision !== input.data.expectedRevision) return NextResponse.json({ error: "The draft changed before publishing. Save the latest revision first." }, { status: 409 });
  const document = validateSiteDocument(project.document);
  if (document.opportunity.status !== "canonical") {
    if (!reviewOpportunity(document).ready) return NextResponse.json({ error: "Complete the opportunity review checklist before publishing." }, { status: 400 });
    if (document.opportunity.visibility === "private") return NextResponse.json({ error: "Private variants cannot be published. Choose Shared for a revocable private link or Public for a discoverable portfolio." }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("publish_project", { p_project_id: projectId, p_slug: input.data.slug, p_expected_revision: input.data.expectedRevision });
  if (error) {
    const conflict = error.message.includes("revision_conflict");
    const slugConflict = error.message.includes("duplicate key");
    return NextResponse.json({ error: conflict ? "The draft changed before publishing. Wait for it to save, then try again." : slugConflict ? "That public URL is already in use." : error.message, code: conflict ? "REVISION_CONFLICT" : "PUBLISH_FAILED" }, { status: conflict ? 409 : slugConflict ? 409 : 500 });
  }
  if (document.opportunity.status === "canonical" && document.visitor.enabled) {
    const { error: knowledgeError } = await supabase.rpc("publish_visitor_documents", { p_project_id: projectId });
    if (knowledgeError) return NextResponse.json({ error: "The portfolio was published, but Visitor Vox documents were not activated. Apply migration 015 and publish again.", code: "VISITOR_DOCUMENT_PUBLICATION_FAILED" }, { status: 503 });
  }
  return NextResponse.json({ publication: data?.[0] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase.rpc("unpublish_project", { p_project_id: projectId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ unpublished: true });
}
