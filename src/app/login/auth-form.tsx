"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm({ nextPath = "/projects" }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const supabase = createSupabaseBrowserClient();
    const result = mode === "signup" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) return setMessage("Check your email to confirm your account, then sign in.");
    router.push(nextPath); router.refresh();
  }

  return <form className="auth-card" onSubmit={submit}>
    <p className="eyebrow">SECURE WORKSPACE</p><h1>{mode === "signin" ? "Welcome back" : "Create your studio"}</h1>
    <p>Save portfolios, reopen them later, and keep every accepted edit in a revision history.</p>
    <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
    <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
    {message && <div className="form-message">{message}</div>}
    <button className="primary-action" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
    <button className="text-action" type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button>
  </form>;
}
