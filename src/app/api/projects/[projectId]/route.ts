import { NextResponse } from "next/server";
import { z } from "zod";
import { siteDocumentSchema } from "@/domain/site-document";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const saveSchema = z.object({ document: siteDocumentSchema, expectedRevision: z.number().int().nonnegative(), source: z.enum(["manual", "voice", "autosave"]).default("autosave") });
const renameSchema = z.object({ action: z.literal("rename"), name: z.string().trim().min(1).max(80) });

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("projects").select("id,name,document,revision,updated_at").eq("id", projectId).single();
  if (error || !data) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ project: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body: unknown = await request.json();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rename = renameSchema.safeParse(body);
  if (rename.success) {
    const { data, error } = await supabase.from("projects").update({ name: rename.data.name }).eq("id", projectId).select("name").single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "Project not found" }, { status: error ? 500 : 404 });
    return NextResponse.json({ name: data.name });
  }

  const input = saveSchema.safeParse(body);
  if (!input.success || input.data.document.projectId !== projectId) return NextResponse.json({ error: "Invalid project document" }, { status: 400 });
  const { data, error } = await supabase.rpc("save_project", { p_project_id: projectId, p_document: input.data.document, p_expected_revision: input.data.expectedRevision, p_source: input.data.source });
  if (error) return NextResponse.json({ error: error.message, code: error.message.includes("revision_conflict") ? "REVISION_CONFLICT" : "SAVE_FAILED" }, { status: error.message.includes("revision_conflict") ? 409 : 500 });
  return NextResponse.json({ revision: data });
}
