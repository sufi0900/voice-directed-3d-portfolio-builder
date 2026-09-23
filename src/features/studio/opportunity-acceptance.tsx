"use client";

import { useState } from "react";

type Check = { id: string; label: string; complete: boolean; detail: string };

export function OpportunityAcceptance({ projectId }: { projectId: string }) {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/opportunity-acceptance`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load delivery readiness.");
      setChecks(result.checks); setReady(result.ready);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load delivery readiness."); }
    finally { setBusy(false); }
  }
  return <section className="opportunity-planner" aria-label="Opportunity delivery readiness">
    <header><strong>Delivery readiness</strong><small>Check the exact saved revision before creating a recipient link.</small></header>
    <button type="button" className="secondary-action" onClick={() => void refresh()} disabled={busy}>{busy ? "Checking…" : "Check delivery readiness"}</button>
    {error && <p className="form-message" role="alert">{error}</p>}
    {checks && <div role="status"><p><strong>{ready ? "Ready to deliver" : "Not ready to deliver"}</strong></p><ul>{checks.map((check) => <li key={check.id}><strong>{check.complete ? "✓" : "○"} {check.label}</strong><small>{check.detail}</small></li>)}</ul></div>}
  </section>;
}
