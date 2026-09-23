import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function ownerContext(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: project } = await supabase.from("projects").select("id").eq("id", projectId).eq("owner_id", user.id).single();
  return project ? { supabase, user } : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const context = await ownerContext(projectId);
  if (!context) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const { data, error } = await context.supabase.from("opportunity_feedback").select("id,rating,message,contact,created_at,publication_id,share_id").eq("project_id", projectId).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Feedback is unavailable. Apply migration 012." }, { status: 503 });
  return NextResponse.json({ feedback: data ?? [] });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const input = z.object({ feedbackId: z.string().uuid() }).strict().safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Select valid feedback." }, { status: 400 });
  const context = await ownerContext(projectId);
  if (!context) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const { error } = await context.supabase.from("opportunity_feedback").delete().eq("id", input.data.feedbackId).eq("project_id", projectId);
  if (error) return NextResponse.json({ error: "Could not delete feedback." }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
