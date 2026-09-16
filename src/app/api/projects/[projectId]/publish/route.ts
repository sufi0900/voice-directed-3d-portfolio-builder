import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publishRequestSchema } from "@/domain/publication";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const input = publishRequestSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Use 3–64 lowercase letters, numbers, and single hyphens for the public URL." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.rpc("publish_project", { p_project_id: projectId, p_slug: input.data.slug, p_expected_revision: input.data.expectedRevision });
  if (error) {
    const conflict = error.message.includes("revision_conflict");
    const slugConflict = error.message.includes("duplicate key");
    return NextResponse.json({ error: conflict ? "The draft changed before publishing. Wait for it to save, then try again." : slugConflict ? "That public URL is already in use." : error.message, code: conflict ? "REVISION_CONFLICT" : "PUBLISH_FAILED" }, { status: conflict ? 409 : slugConflict ? 409 : 500 });
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
