import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hashShareToken, validShareToken } from "@/domain/opportunity-share";
import { opportunityFeedbackSchema } from "@/domain/opportunity-feedback";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!validShareToken(token)) return NextResponse.json({ error: "Share unavailable." }, { status: 404 });
  const input = opportunityFeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Please provide valid feedback." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_opportunity_feedback", {
    p_hash: hashShareToken(token), p_rating: input.data.rating, p_message: input.data.message, p_contact: input.data.contact,
  });
  if (error || data !== true) return NextResponse.json({ error: "This share link is expired, revoked, or unavailable." }, { status: 404 });
  return NextResponse.json({ submitted: true }, { status: 201 });
}
