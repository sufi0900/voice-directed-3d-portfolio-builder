"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { siteDocumentSchema, type SiteDocument } from "@/domain/site-document";

const STORAGE_KEY = "voxfolio-demo-document-v1";
const accents = { cyan: "#4deeea", violet: "#a78bfa", coral: "#fb7185", lime: "#a3e635", rose: "#d94c89", blue: "#75aaff", olive: "#78834b" };

export function ClaimDemo({ email }: { email: string }) {
  const router = useRouter();
  const [document, setDocument] = useState<SiteDocument | null>(null);
  const [projectName, setProjectName] = useState("My Voxfolio portfolio");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const parsed = siteDocumentSchema.safeParse(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
      if (parsed.success) { setDocument(parsed.data); setProjectName(`${parsed.data.identity.name} — Portfolio`); }
    } catch { setDocument(null); }
  }, []);

  async function save() {
    if (!document) return;
    setBusy(true); setError("");
    const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "demo", projectName, document }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setError(result.error ?? "Could not save this portfolio.");
    localStorage.removeItem(STORAGE_KEY);
    router.replace(`/studio/${result.projectId}`); router.refresh();
  }

  return <main className="flow-page"><header className="flow-nav"><Link href="/">← Back to portfolio</Link><strong>VOXFOLIO</strong><Link href="/projects">My projects</Link></header>
    <section className="claim-card"><p className="eyebrow">SAVE YOUR GUEST PORTFOLIO</p><h1>Move this draft into your workspace</h1><p>Signed in as {email}. Your local portfolio will become a private cloud project. You can review it in Studio before publishing.</p>
      {document ? <><div className="claim-summary"><span style={{ background: accents[document.design.accent] }} /><div><strong>{document.identity.name}</strong><small>{document.identity.role}</small></div><em>{document.skills.length} skills · revision {document.revision}</em></div>
        <label>Project name<input value={projectName} maxLength={80} onChange={(event) => setProjectName(event.target.value)} /></label>
        {error && <div className="form-message">{error}</div>}<button type="button" className="primary-action" disabled={busy || !projectName.trim()} onClick={save}>{busy ? "Saving…" : "Save and continue to Studio"}</button></> : <div className="claim-empty"><h2>No guest draft was found</h2><p>Return to the homepage, customize the demo, then choose Save & publish.</p><Link className="primary-action" href="/">Open portfolio demo</Link></div>}
    </section>
  </main>;
}
