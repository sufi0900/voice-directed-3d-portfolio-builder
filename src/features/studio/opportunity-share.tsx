"use client";

import { useEffect, useState } from "react";
import type { SiteDocument } from "@/domain/site-document";
import { OpportunityAcceptance } from "./opportunity-acceptance";

type Share = { id: string; created_at: string; expires_at: string; revoked_at: string | null; openCount?: number };

function shareState(share: Share) {
  if (share.revoked_at) return "Revoked";
  if (new Date(share.expires_at).getTime() <= Date.now()) return "Expired";
  return "Active";
}

export function OpportunityShare({ document, publishedDocument }: { document: SiteDocument; publishedDocument?: SiteDocument }) {
  const [shares, setShares] = useState<Share[]>([]);
  const [createdUrl, setCreatedUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const publishedShared = publishedDocument?.opportunity.visibility === "shared";

  useEffect(() => {
    if (!publishedShared) return;
    let live = true;
    fetch(`/api/projects/${document.projectId}/shares`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load share links.");
        if (live) setShares(data.shares ?? []);
      })
      .catch((cause) => { if (live) setError(cause instanceof Error ? cause.message : "Could not load share links."); });
    return () => { live = false; };
  }, [document.projectId, publishedShared]);

  async function create() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/projects/${document.projectId}/shares`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create a link.");
      setCreatedUrl(`${window.location.origin}${data.url}`);
      setShares((list) => [data.share, ...list]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create a link."); }
    finally { setBusy(false); }
  }

  async function copyCreatedUrl() {
    if (!createdUrl) return;
    try { await navigator.clipboard.writeText(createdUrl); }
    catch { setError("Copy failed. Select and copy the link manually."); }
  }

  async function revoke(id: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/projects/${document.projectId}/shares`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ shareId: id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not revoke the link.");
      setShares((list) => list.map((item) => item.id === id ? { ...item, revoked_at: new Date().toISOString() } : item));
      setCreatedUrl("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not revoke the link."); }
    finally { setBusy(false); }
  }

  if (document.opportunity.status === "canonical") return null;

  return <>
    <OpportunityAcceptance projectId={document.projectId} />
    {document.opportunity.visibility === "shared" && <section className="opportunity-planner" aria-label="Private opportunity links">
      <header><strong>Private share links</strong><small>Links are pinned to the current immutable Shared publication, expire after seven days, and can be revoked at any time.</small></header>
      {!publishedShared && <p className="guardrail-note">Publish this opportunity as Shared before creating a recipient link.</p>}
      {publishedShared && <button type="button" className="secondary-action" onClick={() => void create()} disabled={busy}>{busy ? "Creating…" : "Create private link"}</button>}
      {createdUrl && <div className="share-created" role="status"><strong>New share link</strong><input aria-label="Created private share link" readOnly value={createdUrl} /><button type="button" className="secondary-action" onClick={() => void copyCreatedUrl()}>Copy link</button></div>}
      {error && <p className="form-message" role="alert">{error}</p>}
      {shares.length > 0 && <ul className="share-list">{shares.map((share) => { const state = shareState(share); return <li key={share.id}><div><strong>{state}</strong><small>Expires {new Date(share.expires_at).toLocaleString()} · {share.openCount ?? 0} coarse hourly opens</small></div>{state === "Active" && <button type="button" className="danger-action" onClick={() => void revoke(share.id)} disabled={busy}>Revoke</button>}</li>; })}</ul>}
      <small className="guardrail-note">Only the selected immutable opportunity snapshot is shared. Draft edits, canonical projects, and other variants remain private.</small>
    </section>}
  </>;
}
