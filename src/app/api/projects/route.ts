import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildGuidedDocument, getTemplate } from "@/domain/templates";
import { cvProvenanceSchema, siteDocumentSchema } from "@/domain/site-document";
import { guidedInterviewSchema } from "@/domain/guided-interview";

const createSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("template"), templateId: z.string().min(1), projectName: z.string().trim().min(1).max(80) }),
  z.object({ mode: z.literal("guided"), projectName: z.string().trim().min(1).max(80), name: z.string().trim().min(1).max(60), role: z.string().trim().min(1).max(80), intro: z.string().trim().min(1).max(220), skills: z.array(z.string().trim().min(1).max(32)).max(8).default([]), education: z.array(z.string().trim().min(1).max(220)).max(8).default([]), cv: cvProvenanceSchema.optional(), interview: guidedInterviewSchema }),
  z.object({ mode: z.literal("demo"), projectName: z.string().trim().min(1).max(80), document: siteDocumentSchema }),
]);

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("projects").select("id,name,creation_mode,template_id,revision,created_at,updated_at").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data });
}

export async function POST(request: Request) {
  const input = createSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Invalid project details", issues: input.error.issues }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = crypto.randomUUID();
  const document = input.data.mode === "template"
    ? { ...getTemplate(input.data.templateId)?.document, projectId, updatedAt: new Date().toISOString() }
    : input.data.mode === "guided" ? buildGuidedDocument({
      ...input.data,
      projectId,
      style: input.data.interview.tone === "structured" ? "technical" : input.data.interview.tone === "minimal" ? "minimal" : "creative",
    }) : { ...input.data.document, projectId, revision: 0, updatedAt: new Date().toISOString() };
  if (!document) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  const row = { id: projectId, owner_id: user.id, name: input.data.projectName, creation_mode: input.data.mode === "demo" ? "guided" : input.data.mode, template_id: input.data.mode === "template" ? input.data.templateId : null, document, revision: 0 };
  const { error } = await supabase.from("projects").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { error: revisionError } = await supabase.from("project_revisions").insert({ project_id: projectId, owner_id: user.id, revision: 0, document, source: "created" });
  if (revisionError) return NextResponse.json({ error: revisionError.message }, { status: 500 });
  return NextResponse.json({ projectId }, { status: 201 });
}
