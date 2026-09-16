"use client";

import dynamic from "next/dynamic";
import { Clock3, Copy, Eye, Globe2, Layers3, Palette, Redo2, RotateCcw, Save, Type, Undo2, Volume2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { SiteCommand } from "@/domain/commands";
import type { SiteDocument } from "@/domain/site-document";
import { normalizePublicationSlug } from "@/domain/publication";
import { guestClaimPath } from "@/domain/user-lifecycle";
import { ManualControls } from "./manual-controls";
import { initialStudioState, studioReducer } from "./studio-reducer";
import { useAssemblyAIAgent } from "@/features/voice/use-assemblyai-agent";
import { VoicePanel } from "@/features/voice/voice-panel";
import { RevisionHistory } from "./revision-history";

const OrbitalShowcase = dynamic(() => import("@/features/scene/orbital-showcase").then((module) => module.OrbitalShowcase), {
  ssr: false,
  loading: () => <div className="scene-loading">Preparing Orbital Showcase…</div>,
});

const STORAGE_KEY = "voxfolio-demo-document-v1";
const backgroundClass = { midnight: "bg-midnight", ink: "bg-ink", plum: "bg-plum", cloud: "bg-cloud" } as const;

type Publication = { slug: string; revision: number; published_at: string };

export function PortfolioStudio({ initialDocument, projectName = "Demo portfolio", persistence = "local", initialPublication, authenticated = false }: { initialDocument?: SiteDocument; projectName?: string; persistence?: "local" | "server"; initialPublication?: Publication; authenticated?: boolean }) {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const serverRevision = useRef(initialDocument?.revision ?? 0);
  const [cloudRevision, setCloudRevision] = useState(initialDocument?.revision ?? 0);
  const hydratedDocument = useRef(initialDocument);
  const initialSaveSkipped = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publication, setPublication] = useState<Publication | undefined>(initialPublication);
  const [publishError, setPublishError] = useState("");
  const [slug, setSlug] = useState(initialPublication?.slug ?? normalizePublicationSlug(projectName));
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    let stored: unknown = hydratedDocument.current;
    if (!stored) { try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"); } catch { stored = undefined; } }
    dispatch({ type: "hydrate", document: stored });
    return () => preference.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (persistence === "local") localStorage.setItem(STORAGE_KEY, JSON.stringify(state.present));
    setSaved(false);
    if (persistence === "server" && !initialSaveSkipped.current) { initialSaveSkipped.current = true; setSaved(true); return; }
    const timer = window.setTimeout(async () => {
      if (persistence === "local") return setSaved(true);
      setSaveError("");
      const response = await fetch(`/api/projects/${state.present.projectId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ document: state.present, expectedRevision: serverRevision.current, source: state.receipts.at(-1)?.source ?? "autosave" }) });
      const result = await response.json();
      if (!response.ok) { setSaveError(result.code === "REVISION_CONFLICT" ? "This project changed elsewhere. Refresh before editing again." : result.error ?? "Save failed."); return; }
      serverRevision.current = result.revision; setCloudRevision(result.revision); setSaved(true);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [persistence, state.hydrated, state.present, state.receipts]);

  const executeManual = useCallback((command: SiteCommand) => dispatch({ type: "execute", command, source: "manual" }), []);
  const executeVoice = useCallback((command: SiteCommand) => dispatch({ type: "execute", command, source: "voice" }), []);
  const undoVoice = useCallback(() => dispatch({ type: "undo", source: "voice" }), []);
  const voice = useAssemblyAIAgent({ document: state.present, execute: executeVoice, undo: undoVoice });
  const focusedSkill = useMemo(() => state.present.skills.find((skill) => skill.id === state.present.scene.focusedSkill), [state.present]);

  async function publish() {
    setPublishing(true); setPublishError("");
    const response = await fetch(`/api/projects/${state.present.projectId}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, expectedRevision: serverRevision.current }) });
    const result = await response.json(); setPublishing(false);
    if (!response.ok) return setPublishError(result.error ?? "Publishing failed.");
    setPublication(result.publication); setPublishOpen(false);
  }

  async function unpublish() {
    setPublishing(true); setPublishError("");
    const response = await fetch(`/api/projects/${state.present.projectId}/publish`, { method: "DELETE" });
    const result = await response.json(); setPublishing(false);
    if (!response.ok) return setPublishError(result.error ?? "Could not unpublish.");
    setPublication(undefined); setPublishOpen(false);
  }

  return (
    <main className={`studio ${backgroundClass[state.present.design.background]} ${previewOnly ? "preview-only" : ""}`} data-accent={state.present.design.accent}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Layers3 size={19} /></span><div><strong>VOXFOLIO</strong><small>{projectName}</small></div></div>
        <div className="project-state"><span className={saved ? "saved" : "saving"}><Save size={14} />{saveError || (saved ? persistence === "server" ? "Saved to cloud" : "Saved locally" : "Saving…")}</span><i />Revision {state.present.revision}</div>
        <div className="top-actions">
          <button type="button" onClick={() => dispatch({ type: "undo", source: "manual" })} disabled={!state.past.length} aria-label="Undo"><Undo2 size={17} /></button>
          <button type="button" onClick={() => dispatch({ type: "redo" })} disabled={!state.future.length} aria-label="Redo"><Redo2 size={17} /></button>
          <button type="button" className="preview-button" onClick={() => setPreviewOnly((value) => !value)}><Eye size={16} />{previewOnly ? "Exit preview" : "Preview"}</button>
          {persistence === "server" && <button type="button" className="publish-button" onClick={() => setPublishOpen(true)}><Globe2 size={16} />{publication ? "Published" : "Publish"}</button>}
          {persistence === "server" && <button type="button" onClick={() => setHistoryOpen(true)}><Clock3 size={16} />History</button>}
          {persistence === "local" && <Link className="publish-button top-link" href={guestClaimPath(authenticated)}><Save size={15} />Save & publish</Link>}
          <Link className="top-link" href={authenticated ? "/projects" : "/login"}>{authenticated ? "My projects" : "Sign in"}</Link>
        </div>
      </header>

      <div className="workspace">
        <aside className="editor-panel">
          <div className="panel-intro"><p className="eyebrow">PROJECT · PERSONAL PORTFOLIO</p><h1>Shape the experience</h1><p>Use direct controls for precision. Ask the voice agent for broader changes.</p></div>
          <nav className="editor-tabs" aria-label="Editor sections">
            <Tab active={state.selectedPanel === "content"} label="Content" icon={<Type size={16} />} onClick={() => dispatch({ type: "selectPanel", panel: "content" })} />
            <Tab active={state.selectedPanel === "design"} label="Design" icon={<Palette size={16} />} onClick={() => dispatch({ type: "selectPanel", panel: "design" })} />
            <Tab active={state.selectedPanel === "scene"} label="3D Scene" icon={<Layers3 size={16} />} onClick={() => dispatch({ type: "selectPanel", panel: "scene" })} />
          </nav>
          <ManualControls document={state.present} execute={executeManual} panel={state.selectedPanel} />
          <button type="button" className="reset-button" onClick={() => dispatch({ type: "reset" })}><RotateCcw size={14} />Reset demo</button>
        </aside>

        <section className="preview-shell" aria-label="Live portfolio preview">
          <div className="preview-chrome"><span /><span /><span /><p>portfolio.preview</p><em>LIVE CANVAS</em></div>
          <div className={`portfolio-preview align-${state.present.design.heroAlignment}`}>
            <div className="ambient-grid" />
            <div className="portfolio-copy">
              <p className="availability"><i />{state.present.identity.availability}</p>
              <p className="kicker">DESIGNING USEFUL DIGITAL SYSTEMS</p>
              <h2>{state.present.identity.name}</h2>
              <h3>{state.present.identity.role}</h3>
              <p className="intro">{state.present.identity.intro}</p>
              <div className="hero-actions"><button>View selected work</button><button className="ghost">Start a conversation</button></div>
              {focusedSkill && <div className="focus-card"><span>SCENE FOCUS</span><strong>{focusedSkill.label}</strong><p>Capability level {focusedSkill.level}/5</p></div>}
            </div>
            <div className="scene-stage">
              <OrbitalShowcase document={state.present} execute={executeManual} reducedMotion={reducedMotion} />
              <div className="scene-caption"><Volume2 size={14} /><span>Drag to orbit · Scroll to zoom · Select a skill</span></div>
            </div>
          </div>
        </section>

        <VoicePanel {...voice} />
      </div>
      <footer className="command-footer"><span>One governed command pipeline</span><p>Manual edit <b>→</b> validation <b>→</b> revision <b>→</b> undo</p><p>Voice tool <b>→</b> validation <b>→</b> revision <b>→</b> undo</p></footer>
      {publishOpen && <div className="publish-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPublishOpen(false); }}>
        <section className="publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-title">
          <header><div><span className="eyebrow">IMMUTABLE PUBLICATION</span><h2 id="publish-title">Publish this saved revision</h2></div><button type="button" aria-label="Close publishing dialog" onClick={() => setPublishOpen(false)}><X size={18} /></button></header>
          <p>Publishing creates a fixed public snapshot of revision {serverRevision.current}. Future Studio edits remain drafts until you publish again.</p>
          <label>Public URL slug<div className="slug-field"><span>/p/</span><input value={slug} maxLength={64} onChange={(event) => setSlug(normalizePublicationSlug(event.target.value))} /></div></label>
          {publication && <div className="live-publication"><strong>Currently live</strong><a href={`/p/${publication.slug}`} target="_blank" rel="noreferrer">/p/{publication.slug}</a><span>Revision {publication.revision}</span><button type="button" aria-label="Copy public URL" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/p/${publication.slug}`)}><Copy size={15} /> Copy URL</button></div>}
          {publishError && <p className="form-message">{publishError}</p>}
          <footer><button type="button" className="secondary-action" onClick={() => setPublishOpen(false)}>Cancel</button>{publication && <button type="button" className="danger-action" disabled={publishing} onClick={unpublish}>Unpublish</button>}<button type="button" className="primary-action" disabled={publishing || !saved || Boolean(saveError) || slug.length < 3} onClick={publish}>{publishing ? "Publishing…" : publication ? "Publish current revision" : "Publish portfolio"}</button></footer>
          {!saved && <small>Wait for the latest draft to finish saving before publishing.</small>}
        </section>
      </div>}
      {historyOpen && <RevisionHistory projectId={state.present.projectId} currentRevision={cloudRevision} onClose={() => setHistoryOpen(false)} onRestored={() => window.location.reload()} />}
    </main>
  );
}

function Tab({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return <button type="button" className={active ? "active" : ""} onClick={onClick}>{icon}{label}</button>;
}
