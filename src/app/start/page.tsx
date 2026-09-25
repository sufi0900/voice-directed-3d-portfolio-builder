import Link from "next/link";
import { CreationFlow } from "./creation-flow";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StartPage() {
  let authenticated = false;
  let suggestedName = "";
  if (hasSupabaseConfig) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser(); authenticated = Boolean(data.user);
    const candidate = data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name;
    if (typeof candidate === "string") suggestedName = candidate.trim().slice(0, 60);
  }
  return <main className="flow-page wide"><header className="flow-nav"><Link href="/">Try demo</Link><strong>VOXFOLIO</strong><Link href={authenticated ? "/projects" : "/login"}>{authenticated ? "My projects" : "Sign in"}</Link></header>
    <div className="flow-heading"><p className="eyebrow">CREATE A PORTFOLIO</p><h1>Choose how you want to begin.</h1><p>Both paths lead to the same safe editor, live 3D canvas, voice tools, and revision system.</p></div>
    <CreationFlow authenticated={authenticated} suggestedName={suggestedName} />
  </main>;
}
