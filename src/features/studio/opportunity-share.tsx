"use client";

import { useEffect, useState } from "react";
import type { SiteDocument } from "@/domain/site-document";

type Share = { id: string; expires_at: string; revoked_at: string | null; openCount?: number };

export function OpportunityShare({ document, publishedDocument }: { document: SiteDocument; publishedDocument?: SiteDocument }) {
  const [shares, setShares] = useState<Share[]>([]);
  const [createdUrl, setCreatedUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const publishedShared = publishedDocument?.opportunity.visibility === "shared";
  useEffect(() => {
    if (!publishedShared) return;
    let live = true;
    fetch(`/api/projects/${document.projectId}/shares`).then((response) => response.json()).then((data) => { if (live) setShares(data.shares ?? []); }).catch(() => undefined);
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
  if (document.opportunity.visibility !== "shared") return null;
  return <section className="opportunity-planner" aria-label="Private opportunity links"><header><strong>Private share links</strong><small>Publish this opportunity as Shared first. Links expire after seven days and can be revoked at any time.</small></header>{!publishedShared && <p>Publish the latest Shared version to enable private links.</p>}<button className="secondary-action" type="button" disabled={!publishedShared || busy} onClick={create}>{busy ? "Working…" : "Create private link"}</button>{createdUrl && <div className="opportunity-share-url"><input aria-label="New private share URL" readOnly value={createdUrl} onFocus={(event) => event.target.select()} /><button type="button" onClick={() => void navigator.clipboard.writeText(createdUrl)}>Copy</button><small>Copy this URL now; the token cannot be recovered later.</small></div>}{error && <p role="alert" className="field-error">{error}</p>}{shares.filter((share) => !share.revoked_at && new Date(share.expires_at).getTime() > Date.now()).map((share) => <div className="opportunity-share-row" key={share.id}><small>Active until {new Date(share.expires_at).toLocaleDateString()} · {share.openCount ?? 0} hourly opens</small><button type="button" disabled={busy} onClick={() => revoke(share.id)}>Revoke</button></div>)}</section>;
}
