import Link from "next/link";
import { CreationFlow } from "./creation-flow";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StartPage() {
  let authenticated = false;
  let suggestedName = "";
  let ownerId = "guest";
  if (hasSupabaseConfig) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser(); authenticated = Boolean(data.user);
    ownerId = data.user?.id ?? "guest";
    const candidate = data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name;
    if (typeof candidate === "string") suggestedName = candidate.trim().slice(0, 60);
  }
  return <main className="flow-page wide"><header className="flow-nav"><Link href="/">Try demo</Link><strong>VOXFOLIO</strong><Link href={authenticated ? "/projects" : "/login"}>{authenticated ? "My projects" : "Sign in"}</Link></header>
    <div className="flow-heading"><p className="eyebrow">VOICE-DIRECTED CREATION</p><h1>Build your portfolio with Vox.</h1><p>Tell Vox about your work, confirm the exact details, and watch a private cinematic portfolio take shape. Accessible text and template routes remain available.</p></div>
    <CreationFlow authenticated={authenticated} suggestedName={suggestedName} ownerId={ownerId} />
  </main>;
}
