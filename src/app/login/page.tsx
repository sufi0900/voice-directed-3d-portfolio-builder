import Link from "next/link";
import { AuthForm } from "./auth-form";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { safeNextPath } from "@/domain/user-lifecycle";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const nextPath = safeNextPath((await searchParams).next);
  return <main className="flow-page"><header className="flow-nav"><Link href="/start">← Back</Link><strong>VOXFOLIO</strong></header>
    {hasSupabaseConfig ? <AuthForm nextPath={nextPath} /> : <section className="auth-card"><p className="eyebrow">SETUP REQUIRED</p><h1>Connect project storage</h1><p>Add your Supabase URL and anonymous key to <code>.env.local</code>. The original demo remains available.</p><Link className="primary-action" href="/">Open local demo</Link></section>}
  </main>;
}
