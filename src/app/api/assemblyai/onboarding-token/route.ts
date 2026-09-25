import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before starting your voice interview." }, { status: 401 });
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) return NextResponse.json({ error: "Voice is unavailable. Use the typed interview instead." }, { status: 503 });
  const { data: allowed, error: limitError } = await supabase.rpc("claim_vox_interview_use");
  if (limitError || !allowed) return NextResponse.json({ error: "Voice interviews are temporarily unavailable or you reached today's session limit. Continue by typing." }, { status: 429 });
  const url = new URL("https://agents.assemblyai.com/v1/token");
  url.searchParams.set("expires_in_seconds", "60");
  url.searchParams.set("max_session_duration_seconds", "300");
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error("unavailable");
    const { token } = await response.json() as { token?: string };
    if (!token) throw new Error("unavailable");
    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Voice is unavailable. Use the typed interview instead." }, { status: 503 }); }
}
