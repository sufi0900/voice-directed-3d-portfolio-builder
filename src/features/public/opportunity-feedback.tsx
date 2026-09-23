"use client";

import { useState } from "react";

export function OpportunityFeedback({ token }: { token: string }) {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setState("busy"); setError("");
    try {
      const response = await fetch(`/api/shared-opportunities/${token}/feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating, message, contact }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Feedback could not be submitted.");
      setState("done"); setMessage(""); setContact("");
    } catch (cause) { setState("error"); setError(cause instanceof Error ? cause.message : "Feedback could not be submitted."); }
  }
  if (state === "done") return <section className="opportunity-planner" aria-label="Feedback submitted"><strong>Thank you for the feedback.</strong><p>Your response was sent privately to the portfolio owner.</p></section>;
  return <section className="opportunity-planner" aria-label="Private opportunity feedback"><header><strong>Share feedback</strong><small>Your response is private to the owner. No IP address or device fingerprint is collected.</small></header><form onSubmit={submit}>
    <label className="field"><span>Rating</span><select value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
    <label className="field"><span>Feedback</span><textarea required minLength={3} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What should the owner know?" /></label>
    <label className="field"><span>Contact (optional)</span><input maxLength={160} value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Email or name, if you want a reply" /></label>
    {error && <p className="form-message" role="alert">{error}</p>}<button type="submit" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Send private feedback"}</button>
  </form></section>;
}
