"use client";

import { useEffect, useState } from "react";
import type { SiteDocument } from "@/domain/site-document";
import type { SiteCommand } from "@/domain/commands";
import { blogProposalSchema, buildBlogWritingCommand, type BlogProposal } from "@/domain/blog-writing";

type BlogPost = SiteDocument["publishing"]["posts"][number];

export function BlogWritingAssistant({ document, post, execute, enabled, ensureSaved, seededNotes }: {
  document: SiteDocument; post: BlogPost; execute: (command: SiteCommand) => void; enabled: boolean;
  ensureSaved?: () => Promise<number>; seededNotes?: { id: number; text: string };
}) {
  const [notes, setNotes] = useState("");
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<BlogProposal | null>(null);
  const [proposalSnapshot, setProposalSnapshot] = useState("");
  const storageKey = `voxfolio-blog-notes:${document.projectId}:${post.id}`;
  useEffect(() => {
    try { setNotes(sessionStorage.getItem(storageKey) ?? ""); } catch { setNotes(""); }
    setNotesLoaded(true);
    setProposal(null); setError("");
  }, [storageKey]);
  useEffect(() => { if (notesLoaded) try { sessionStorage.setItem(storageKey, notes); } catch {} }, [storageKey, notes, notesLoaded]);
  useEffect(() => {
    if (seededNotes?.text) { setNotes(current => [current.trim(), seededNotes.text.trim()].filter(Boolean).join("\n").slice(0, 3000)); setProposal(null); }
  }, [seededNotes?.id, seededNotes?.text]);

  async function generate() {
    if (!enabled || busy || notes.trim().length < 40) return;
    setBusy(true); setError(""); setProposal(null);
    try {
      if (ensureSaved) await ensureSaved();
      const snapshot = JSON.stringify(post);
      const response = await fetch("/api/content/blog-draft", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: document.projectId, postId: post.id, notes: notes.trim() }),
      });
      const payload = await response.json() as { proposal?: unknown; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not prepare the article proposal.");
      const validated = blogProposalSchema.safeParse(payload.proposal);
      if (!validated.success) throw new Error("The draft did not pass content validation. Your notes are safe; please try again.");
      setProposal(validated.data); setProposalSnapshot(snapshot);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Writing is temporarily unavailable. Your notes are safe."); }
    finally { setBusy(false); }
  }

  function accept() {
    if (!proposal) return;
    if (JSON.stringify(post) !== proposalSnapshot) { setError("This article changed since the proposal was generated. Review it and request a fresh proposal."); return; }
    try {
      execute(buildBlogWritingCommand(document, post, proposal));
      setProposal(null); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add the reviewed copy."); }
  }

  return <section className="blog-writing-assistant" aria-label="Write an article with Vox">
    <header><div><span className="eyebrow">WRITE WITH VOX</span><h3>Turn your ideas into an article draft</h3></div><small>Owner review required</small></header>
    <p>Share your own thoughts, examples and verified facts. Vox will suggest structured copy and search text for you to review. No article is published by this tool.</p>
    <label>Ideas and facts for this article<textarea rows={7} maxLength={3000} value={notes} onChange={event => { setNotes(event.target.value); setProposal(null); }} placeholder="What happened? What did you learn? Which claims can you support? Paste your voice conversation or rough notes here." /></label>
    <div className="blog-writing-actions"><button type="button" className="secondary-action" disabled={!enabled || busy || notes.trim().length < 40} onClick={() => void generate()}>{busy ? "Preparing a reviewable proposal…" : "Draft from my notes"}</button><small>{notes.trim().length}/3000 · minimum 40 characters</small></div>
    {!enabled && <p role="status">Sign in and save this portfolio to use AI writing. The regular editor remains available.</p>}
    {error && <p className="form-message" role="alert">{error}</p>}
    {proposal && <div className="blog-writing-review" role="region" aria-label="Review proposed article">
      <strong>Review before adding this copy</strong>
      <p><b>Introduction</b> {proposal.introduction}</p>
      {proposal.sections.map((section, index) => <article key={index}><h4>{section.heading}</h4><p>{section.body}</p></article>)}
      <p><b>Closing</b> {proposal.conclusion}</p>
      <p><b>Excerpt</b> {proposal.excerpt}</p><p><b>SEO title</b> {proposal.seoTitle}</p><p><b>SEO description</b> {proposal.seoDescription}</p>
      {proposal.questions.length > 0 && <aside><strong>Facts to check before publication</strong><ul>{proposal.questions.map((question,index)=><li key={index}>{question}</li>)}</ul></aside>}
      <p>Accepting adds this copy to the existing editor and fills blank excerpt and SEO fields. Existing text, images and publication status are preserved.</p>
      <div className="blog-writing-actions"><button type="button" className="primary-action" onClick={accept}>Add reviewed copy to draft</button><button type="button" className="secondary-action" onClick={() => setProposal(null)}>Discard proposal</button></div>
    </div>}
  </section>;
}
