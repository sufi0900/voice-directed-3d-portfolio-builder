import { buildPublicationSnapshot, publicationChoices } from "@/domain/publication-selection";
import { revalidatePath } from "next/cache";
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
  const {data:live,error:liveError}=await supabase.from("project_publications").select("id,document").eq("project_id",projectId).is("superseded_at",null).maybeSingle();
  if(liveError) return NextResponse.json({error:"Could not load the live version. Retry before publishing."},{status:503});
  let snapshot;
  try { snapshot=buildPublicationSnapshot(document,live?validateSiteDocument(live.document):undefined,input.data.selection??publicationChoices(document,live?.document).filter(row=>!row.missing.length).map(row=>row.key),input.data.itemAction); }
  catch(cause){return NextResponse.json({error:cause instanceof Error?cause.message:"Check your selected content."},{status:400});}
  const { data, error } = await supabase.rpc("publish_project_snapshot", { p_project_id: projectId, p_slug: input.data.slug, p_expected_revision: input.data.expectedRevision, p_snapshot:snapshot, p_expected_publication_id:live?.id??null });
  if (error) {
    if(error.message.includes("publication_conflict")) return NextResponse.json({error:"Another session published this portfolio. Reload to review the latest live version before publishing."},{status:409});
    const conflict = error.message.includes("revision_conflict");
    const slugConflict = error.message.includes("duplicate key");
    return NextResponse.json({ error: conflict ? "The draft changed before publishing. Wait for it to save, then try again." : slugConflict ? "That public URL is already in use." : error.message.includes("publish_project_snapshot") ? "Apply migration 016_publication_snapshot.sql in Supabase, then retry." : error.message, code: conflict ? "REVISION_CONFLICT" : "PUBLISH_FAILED" }, { status: conflict ? 409 : slugConflict ? 409 : 500 });
  }
  let warning: string | undefined;
  if (snapshot.opportunity.status === "canonical" && snapshot.visitor.enabled) {
    const { error: knowledgeError } = await supabase.rpc("publish_visitor_documents", { p_project_id: projectId });
    if (knowledgeError) warning = "Website published. Visitor Vox documents could not be activated; apply migration 015 and publish Visitor Vox settings again.";
  }
  revalidatePath(`/p/${input.data.slug}`, "layout");
  return NextResponse.json({ publication: data?.[0], document:snapshot, warning });
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

export async function GET(_:Request,{params}:{params:Promise<{projectId:string}>}){
 const {projectId}=await params;const db=await createSupabaseServerClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data,error}=await db.from("project_publications").select("slug").eq("project_id",projectId).eq("owner_id",user.id).is("superseded_at",null).maybeSingle();
 if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({publication:data});
}
