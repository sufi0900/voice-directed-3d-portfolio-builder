"use client";

import { useEffect, useState } from "react";
import type { SiteDocument } from "@/domain/site-document";
import { applySiteCommand } from "@/domain/commands";

type DocumentEntry = { id: string; file_name: string; body: string; published: boolean; created_at: string };

export function VisitorKnowledge({ projectId, initialDocument }: { projectId: string; initialDocument: SiteDocument }) {
  const [site, setSite] = useState(initialDocument);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const base = `/api/projects/${projectId}/visitor-documents`;
  useEffect(() => {
    let cancelled = false;
    void fetch(base).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); if (!cancelled) setDocuments(result.documents); }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load documents. Apply migration 015."); });
    return () => { cancelled = true; };
  }, [base]);
  async function upload(file: File) {
    setBusy(true); setError("");
    try {
      const data = new FormData(); data.set("file", file);
      const response = await fetch(base, { method: "POST", body: data });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setDocuments((current) => [result.document, ...current]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch(base, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setDocuments((current) => current.filter((entry) => entry.id !== id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Removal failed."); }
    finally { setBusy(false); }
  }
  async function toggle(enabled: boolean) {
    setBusy(true); setError("");
    try {
      const latestResponse = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
      const latest = await latestResponse.json(); if (!latestResponse.ok) throw new Error(latest.error);
      const current: SiteDocument = { ...latest.project.document, revision: latest.project.revision };
      const next = applySiteCommand(current, { type: "visitor.enable", enabled });
      const response = await fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ document: next, expectedRevision: current.revision, source: "manual" }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setSite({ ...next, revision: result.revision });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the setting. Refresh the project and retry."); }
    finally { setBusy(false); }
  }
  return <section className="visitor-knowledge" aria-label="Visitor Vox knowledge">
    <h2>Visitor Vox</h2>
    <p>Let visitors ask about published work by voice or text. Upload up to 10 documents; all readable text is saved with your portfolio and searched when a visitor asks a question. The original file is processed and discarded. Your saved text and document list are available when you sign in again.</p>
    <label className="visitor-toggle"><input type="checkbox" checked={site.visitor.enabled} disabled={busy} onChange={(event) => void toggle(event.target.checked)} />Show Visitor Vox on my public portfolio</label>
    <p>Uploaded documents stay private until you enable Visitor Vox and publish the portfolio from Studio. New uploads require publishing again. Removing a document immediately stops it from being used. Never upload information that visitors must not receive.</p>
    <label>Upload TXT, MD, PDF or DOCX (2 MB per file, up to 200,000 readable characters)
      <input type="file" accept=".txt,.md,.pdf,.docx" disabled={busy || documents.length >= 10} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />
    </label>
    {busy && <p role="status">Saving your changes…</p>}
    {error && <p role="alert">{error}</p>}
    <h3>Saved documents ({documents.length}/10)</h3>
    <ul>{documents.map((entry) => <li key={entry.id}><strong>{entry.file_name}</strong><small>{entry.body.length.toLocaleString()} characters saved · {entry.published ? "Included after latest publication" : "Publish the portfolio to make available"}</small><details><summary>Review extracted text</summary><p className="visitor-saved-text">{entry.body}</p></details><button type="button" disabled={busy} onClick={() => void remove(entry.id)}>Remove document</button></li>)}</ul>
    {site.visitor.facts.length > 0 && <p>Legacy approved notes remain in this portfolio. You can edit them in earlier Studio versions; future knowledge is managed here as documents.</p>}
  </section>;
}
