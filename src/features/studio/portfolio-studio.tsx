"use client";

import { Clock3, Copy, Eye, Globe2, Layers3, Maximize2, Minimize2, Palette, PanelRightOpen, Redo2, RotateCcw, Save, Type, Undo2, Volume2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import type { SiteCommand } from "@/domain/commands";
import type { PortfolioSection, SiteDocument } from "@/domain/site-document";
import { normalizePublicationSlug } from "@/domain/publication";
import { guestClaimPath } from "@/domain/user-lifecycle";
import { ManualControls, type PreviewTarget } from "./manual-controls";
import { initialStudioState, studioReducer } from "./studio-reducer";
import { useAssemblyAIAgent } from "@/features/voice/use-assemblyai-agent";
import { VoicePanel } from "@/features/voice/voice-panel";
import { RevisionHistory } from "./revision-history";
import { PortfolioNavigation, PortfolioSections } from "@/features/portfolio/portfolio-sections";
import { StructuredContent } from "@/features/public/public-content";
import Image from "next/image";
import { scrollPreviewContainer } from "./preview-navigation";
import { SceneRenderer } from "@/features/scene/scene-renderer";

const STORAGE_KEY = "voxfolio-demo-document-v1";
const backgroundClass = { midnight: "bg-midnight", ink: "bg-ink", plum: "bg-plum", cloud: "bg-cloud", ivory: "bg-ivory" } as const;

type Publication = { slug: string; revision: number; published_at: string; document?: SiteDocument };

export function PortfolioStudio({ initialDocument, projectName = "Demo portfolio", persistence = "local", initialPublication, authenticated = false, userEmail }: { initialDocument?: SiteDocument; projectName?: string; persistence?: "local" | "server"; initialPublication?: Publication; authenticated?: boolean; userEmail?: string }) {
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
  const [publishedDocument, setPublishedDocument] = useState<SiteDocument | undefined>(initialPublication?.document);
  const [pendingGlobalPublication, setPendingGlobalPublication] = useState(false);
  const [publishingItemId, setPublishingItemId] = useState("");
  const [saveRetry, setSaveRetry] = useState(0);
  const [publishError, setPublishError] = useState("");
  const [slug, setSlug] = useState(initialPublication?.slug ?? normalizePublicationSlug(projectName));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>({ section: "hero" });
  const [editorWidth, setEditorWidth] = useState(300);
  const [voiceWidth, setVoiceWidth] = useState(320);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [voiceHidden, setVoiceHidden] = useState(false);
  const [pendingItemPublication, setPendingItemPublication] = useState<{ kind: "page" | "post"; itemId: string; status: "draft" | "published"; targetRevision: number } | null>(null);
  const [itemPublishError, setItemPublishError] = useState("");

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
    const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const link = existing ?? document.head.appendChild(document.createElement("link"));
    const previous = link.href;
    link.rel = "icon";
    link.href = state.present.media.headshotUrl || initialsFavicon(state.present.identity.name, state.present.design.accent);
    return () => { link.href = previous; if (!existing) link.remove(); };
  }, [state.present.design.accent, state.present.identity.name, state.present.media.headshotUrl]);

  useEffect(() => {
    if (!state.hydrated) return;
    if (persistence === "local") localStorage.setItem(STORAGE_KEY, JSON.stringify(state.present));
    setSaved(false);
    if (persistence === "server" && !initialSaveSkipped.current) { initialSaveSkipped.current = true; setSaved(true); return; }
    const timer = window.setTimeout(async () => {
      if (persistence === "local") return setSaved(true);
      setSaveError("");
      try {
        const response = await fetch(`/api/projects/${state.present.projectId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ document: state.present, expectedRevision: serverRevision.current, source: state.receipts.at(-1)?.source ?? "autosave" }) });
        const result = await response.json();
        if (!response.ok) { setSaveError(result.code === "REVISION_CONFLICT" ? "This project changed elsewhere. Refresh before editing again." : result.error ?? "Save failed."); return; }
        serverRevision.current = result.revision; setCloudRevision(result.revision); setSaved(true);
      } catch { setSaveError("The draft could not reach the server. Your edits remain in this browser; retry before publishing."); }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [persistence, saveRetry, state.hydrated, state.present, state.receipts]);

  const executeManual = useCallback((command: SiteCommand) => dispatch({ type: "execute", command, source: "manual" }), []);
  const executeVoice = useCallback((command: SiteCommand, next?: SiteDocument) => dispatch({ type: "execute", command, source: "voice", next }), []);
  const undoVoice = useCallback(() => dispatch({ type: "undo", source: "voice" }), []);
  const navigateFromAssistant = useCallback((target: { section: string; itemId?: string; panel?: "content" | "design" | "scene" }) => {
    setPreviewOnly(false);
    setEditorExpanded(false);
    setPreviewTarget({ section: target.section, ...(target.itemId ? { itemId: target.itemId } : {}) });
    dispatch({ type: "selectPanel", panel: target.panel ?? "content" });
  }, []);
  const voice = useAssemblyAIAgent({ document: state.present, execute: executeVoice, undo: undoVoice, navigate: navigateFromAssistant });
  const focusedSkill = useMemo(() => state.present.skills.find((skill) => skill.id === state.present.scene.focusedSkill), [state.present]);
  const portfolioHasUnpublishedChanges = useMemo(() => Boolean(publication && (!publishedDocument || JSON.stringify(publishedDocument) !== JSON.stringify(state.present))), [publication, publishedDocument, state.present]);

  const publishItem = useCallback((kind: "page" | "post", itemId: string, status: "draft" | "published") => {
    if (persistence !== "server") return setItemPublishError("Sign in and save this portfolio before publishing content.");
    if (slug.length < 3) return setItemPublishError("Set a valid public portfolio URL from the main Publish dialog first.");
    setItemPublishError("");
    const collection = kind === "page" ? state.present.publishing.pages : state.present.publishing.posts;
    const item = collection.find((entry) => entry.id === itemId);
    if (!item) return setItemPublishError("That content item no longer exists.");
    const changesStatus = item.status !== status;
    if (changesStatus) executeManual({ type: "publishing.setStatus", kind, itemId, status });
    setPendingItemPublication({ kind, itemId, status, targetRevision: state.present.revision + (changesStatus ? 1 : 0) });
  }, [executeManual, persistence, slug.length, state.present]);

  useEffect(() => {
    if (!pendingItemPublication || !saved || cloudRevision < pendingItemPublication.targetRevision || cloudRevision !== state.present.revision || publishing) return;
    const snapshot = state.present;
    setPendingItemPublication(null); setPublishing(true); setPublishingItemId(pendingItemPublication.itemId); setItemPublishError("");
    void (async () => {
      try {
        const response = await fetch(`/api/projects/${state.present.projectId}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, expectedRevision: cloudRevision }) });
        const result = await response.json();
        if (!response.ok) return setItemPublishError(result.error ?? "Could not update the live article collection.");
        setPublishedDocument(snapshot);
        setPublication({ ...result.publication, document: snapshot });
      } catch { setItemPublishError("The publication request was interrupted. Your saved draft is safe; please try again."); }
      finally { setPublishing(false); setPublishingItemId(""); }
    })();
  }, [cloudRevision, pendingItemPublication, publishing, saved, slug, state.present]);

  function publish() {
    setPublishError("");
    setPendingGlobalPublication(true);
    if (saveError) { setSaveError(""); setSaveRetry((value) => value + 1); }
  }

  useEffect(() => {
    if (!pendingGlobalPublication || publishing || !saved || saveError || cloudRevision !== state.present.revision) return;
    const snapshot = state.present;
    setPendingGlobalPublication(false); setPublishing(true); setPublishError("");
    void (async () => {
      try {
        const response = await fetch(`/api/projects/${snapshot.projectId}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, expectedRevision: cloudRevision }) });
        const result = await response.json();
        if (!response.ok) return setPublishError(result.error ?? "Publishing failed.");
        setPublishedDocument(snapshot);
        setPublication({ ...result.publication, document: snapshot });
        setPublishOpen(false);
      } catch { setPublishError("The publish request was interrupted. Your saved draft is safe; please try again."); }
      finally { setPublishing(false); }
    })();
  }, [cloudRevision, pendingGlobalPublication, publishing, saveError, saved, slug, state.present]);

  async function unpublish() {
    setPublishing(true); setPublishError("");
    const response = await fetch(`/api/projects/${state.present.projectId}/publish`, { method: "DELETE" });
    const result = await response.json(); setPublishing(false);
    if (!response.ok) return setPublishError(result.error ?? "Could not unpublish.");
    setPublication(undefined); setPublishedDocument(undefined); setPublishOpen(false);
  }

  const isLightTheme = state.present.design.template === "professional-2d";

  return (
    <main className={`studio template-${state.present.design.template} ${backgroundClass[state.present.design.background]} ${previewOnly ? "preview-only" : ""} ${editorExpanded ? "editor-expanded" : ""} ${isLightTheme ? "light-theme" : ""}`} data-accent={state.present.design.accent}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Layers3 size={19} /></span><div><strong>VOXFOLIO</strong><small>{projectName}</small></div></div>
        <div className="project-state"><span className={saved ? "saved" : "saving"}><Save size={14} />{saveError || (saved ? persistence === "server" ? "Saved to cloud" : "Saved locally" : "Saving…")}</span><i />Revision {state.present.revision}</div>
        <div className="top-actions">
          <button type="button" onClick={() => dispatch({ type: "undo", source: "manual" })} disabled={!state.past.length} aria-label="Undo"><Undo2 size={17} /></button>
          <button type="button" onClick={() => dispatch({ type: "redo" })} disabled={!state.future.length} aria-label="Redo"><Redo2 size={17} /></button>
          <button type="button" className="preview-button" onClick={() => { if (previewOnly) setPreviewOnly(false); else { setEditorExpanded(false); setPreviewOnly(true); } }}><Eye size={16} />{previewOnly ? "Exit preview" : "Preview"}</button>
          {persistence === "server" && <button type="button" className="publish-button" onClick={() => setPublishOpen(true)}><Globe2 size={16} />{publication ? portfolioHasUnpublishedChanges ? "Changes pending" : "Published" : "Publish"}</button>}
          {persistence === "server" && <button type="button" onClick={() => setHistoryOpen(true)}><Clock3 size={16} />History</button>}
          {persistence === "local" && <Link className="publish-button top-link" href={guestClaimPath(authenticated)}><Save size={15} />Save & publish</Link>}
          <Link className="top-link" href={authenticated ? "/projects" : "/login"}>{authenticated ? "My projects" : "Sign in"}</Link>
          {authenticated && userEmail && <span className="account-pill" title={userEmail} aria-label={`Signed in as ${userEmail}`}>{userEmail.slice(0, 1).toUpperCase()}</span>}
        </div>
      </header>

      <div className="workspace" style={{ gridTemplateColumns: previewOnly ? undefined : editorExpanded ? "minmax(420px, 1fr) 0 0" : `${editorWidth}px minmax(420px,1fr) ${voiceHidden ? "0px" : `${voiceWidth}px`}` }}>
        <aside className="editor-panel">
          <div className="panel-intro"><div className="panel-title-row"><div><p className="eyebrow">PROJECT · PERSONAL PORTFOLIO</p><h1>Shape the experience</h1></div><button type="button" title={editorExpanded ? "Restore workspace" : "Expand editor"} aria-label={editorExpanded ? "Restore workspace" : "Expand editor"} onClick={() => setEditorExpanded((value) => !value)}>{editorExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div><p>Use direct controls for precision. Ask the voice agent for broader changes.</p></div>
          <nav className="editor-tabs" aria-label="Editor sections">
            <Tab active={state.selectedPanel === "content"} label="Content" icon={<Type size={16} />} onClick={() => dispatch({ type: "selectPanel", panel: "content" })} />
            <Tab active={state.selectedPanel === "design"} label="Design" icon={<Palette size={16} />} onClick={() => dispatch({ type: "selectPanel", panel: "design" })} />
            <Tab active={state.selectedPanel === "scene"} label="3D Scene" icon={<Layers3 size={16} />} onClick={() => dispatch({ type: "selectPanel", panel: "scene" })} />
          </nav>
          {state.lastCommandError && <p className="form-message" role="alert">{state.lastCommandError}</p>}
          <div className="expanded-editor-surface"><ManualControls document={state.present} publishedDocument={publishedDocument} execute={executeManual} panel={state.selectedPanel} canUploadMedia={persistence === "server" && authenticated} previewTarget={previewTarget} onPreviewTarget={setPreviewTarget} onPublishItem={publishItem} publishingItemId={publishingItemId || pendingItemPublication?.itemId || (pendingGlobalPublication || publishing ? "__snapshot__" : "")} itemPublishError={itemPublishError} canDirectPublish={persistence === "server" && authenticated && slug.length >= 3} /></div>
          <button type="button" className="reset-button" onClick={() => dispatch({ type: "reset" })}><RotateCcw size={14} />Reset demo</button>
        </aside>

        {!previewOnly && !editorExpanded && <button type="button" className="panel-resizer editor-resizer" style={{ left: editorWidth - 3 }} aria-label="Resize content editor" onPointerDown={(event) => beginResize(event, editorWidth, setEditorWidth, 260, 620, 1)} />}

        {!editorExpanded && <section className="preview-shell" aria-label="Live portfolio preview">
          <div className="preview-chrome"><span /><span /><span /><p>portfolio.preview</p><em>LIVE CANVAS</em></div>
          <StudioPreview document={state.present} target={previewTarget} focusedSkill={focusedSkill} execute={executeManual} reducedMotion={reducedMotion} onNavigate={setPreviewTarget} />
        </section>}

        {!previewOnly && !editorExpanded && !voiceHidden && <button type="button" className="panel-resizer voice-resizer" style={{ right: voiceWidth - 3 }} aria-label="Resize voice assistant" onPointerDown={(event) => beginResize(event, voiceWidth, setVoiceWidth, 260, 520, -1)} />}
        {!previewOnly && !editorExpanded && !voiceHidden && <VoicePanel {...voice} onHide={() => setVoiceHidden(true)} />}
        {!previewOnly && !editorExpanded && voiceHidden && <button type="button" className="restore-voice" onClick={() => setVoiceHidden(false)}><PanelRightOpen size={16} />Show voice assistant</button>}
      </div>
      <footer className="command-footer"><span>One governed command pipeline</span><p>Manual edit <b>→</b> validation <b>→</b> revision <b>→</b> undo</p><p>Voice tool <b>→</b> validation <b>→</b> revision <b>→</b> undo</p></footer>
      {publishOpen && <div className="publish-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPublishOpen(false); }}>
        <section className="publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-title">
          <header><div><span className="eyebrow">IMMUTABLE PUBLICATION</span><h2 id="publish-title">Publish this saved revision</h2></div><button type="button" aria-label="Close publishing dialog" onClick={() => setPublishOpen(false)}><X size={18} /></button></header>
          <p>Publishing creates a fixed public snapshot of revision {serverRevision.current}. Future Studio edits remain drafts until you publish again.</p>
          <label>Public URL slug<div className="slug-field"><span>/p/</span><input value={slug} maxLength={64} onChange={(event) => setSlug(normalizePublicationSlug(event.target.value))} /></div></label>
          {publication && <div className="live-publication"><strong>Currently live</strong><a href={`/p/${publication.slug}`} target="_blank" rel="noreferrer">/p/{publication.slug}</a><span>Revision {publication.revision}</span><button type="button" aria-label="Copy public URL" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/p/${publication.slug}`)}><Copy size={15} /> Copy URL</button></div>}
          {publishError && <p className="form-message">{publishError}</p>}
          <footer><button type="button" className="secondary-action" onClick={() => setPublishOpen(false)}>Cancel</button>{publication && <button type="button" className="danger-action" disabled={publishing || pendingGlobalPublication} onClick={unpublish}>Unpublish</button>}<button type="button" className="primary-action" disabled={publishing || pendingGlobalPublication || slug.length < 3} onClick={publish}>{publishing ? "Publishing…" : pendingGlobalPublication ? "Saving latest draft…" : saved ? publication ? "Publish all changes" : "Publish portfolio" : "Save & publish"}</button></footer>
          {!saved && !saveError && <small>Your latest edits will save first, then the complete portfolio will publish automatically.</small>}
          {saveError && <small>The last save failed. “Save & publish” will retry it before publishing.</small>}
        </section>
      </div>}
      {historyOpen && <RevisionHistory projectId={state.present.projectId} currentRevision={cloudRevision} onClose={() => setHistoryOpen(false)} onRestored={() => window.location.reload()} />}
    </main>
  );
}

function StudioPreview({ document, target, focusedSkill, execute, reducedMotion, onNavigate }: { document: SiteDocument; target: PreviewTarget; focusedSkill?: SiteDocument["skills"][number]; execute: (command: SiteCommand) => void; reducedMotion: boolean; onNavigate: (target: PreviewTarget) => void }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const previousPreviewMode = useRef(target.section === "site pages" || target.section === "blog posts" ? "standalone" : "home");
  useLayoutEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    const mode = target.section === "site pages" || target.section === "blog posts" ? "standalone" : "home";
    const changedRoute = previousPreviewMode.current !== mode;
    previousPreviewMode.current = mode;
    const frame = window.requestAnimationFrame(() => scrollPreviewContainer(container, target, reducedMotion || changedRoute ? "auto" : "smooth"));
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion, target]);
  const item = target.section === "site pages" ? document.publishing.pages.find((entry) => entry.id === target.itemId) : target.section === "blog posts" ? document.publishing.posts.find((entry) => entry.id === target.itemId) : undefined;
  if (target.section === "blog posts" && target.itemId === "__index__") return <StudioBlogIndex document={document} onNavigate={onNavigate} />;
  if (target.section === "site pages" || target.section === "blog posts") { const cover = item ? document.media.assets.find((asset) => asset.id === item.coverMediaId) : undefined; return <div ref={previewRef} className="portfolio-preview content-draft-preview"><button type="button" className="preview-back-button" onClick={() => onNavigate({ section: "hero" })}>← Back to homepage preview</button>{item ? <article><p className="section-eyebrow">{target.section === "blog posts" ? "BLOG ARTICLE PREVIEW" : "SITE PAGE PREVIEW"}</p><h1>{item.title}</h1>{"excerpt" in item && item.excerpt && <p className="draft-excerpt">{item.excerpt}</p>}{cover && <figure className="published-content-cover draft-cover"><Image src={cover.url} alt={cover.alt} fill sizes="(max-width: 900px) 94vw, 900px" unoptimized /></figure>}<StructuredContent document={document} blocks={item.blocks} /></article> : <div className="portfolio-empty-state">Create an item to preview it here.</div>}</div>; }
  const navigateSection = (section: PortfolioSection) => onNavigate({ section });
  const sceneHint = document.scene.family === "kinetic-gallery" ? "Move to shift perspective · Select a skill" : document.scene.family === "velocity-roadster" ? "Move to steer the light · Watch the road flow" : "Drag to orbit · Scroll to zoom · Select a skill";
  return <div ref={previewRef} className={`portfolio-preview template-${document.design.template}`}><PortfolioNavigation document={document} onNavigateSection={navigateSection} onNavigatePage={(itemId) => onNavigate({ section: "site pages", itemId })} onNavigateBlog={() => onNavigate({ section: "blog posts", itemId: "__index__" })} /><div className={`portfolio-hero align-${document.design.heroAlignment}`}><div className="ambient-grid" /><div className="portfolio-copy"><p className="availability"><i />{document.identity.availability}</p><p className="kicker">DESIGNING USEFUL DIGITAL SYSTEMS</p><h2>{document.identity.name}</h2><h3>{document.identity.role}</h3><p className="intro">{document.identity.intro}</p><div className="hero-actions"><button type="button" onClick={() => navigateSection("projects")}>View selected work</button><button type="button" className="ghost" onClick={() => navigateSection("contact")}>Start a conversation</button></div>{focusedSkill && <div className="focus-card"><span>SCENE FOCUS</span><strong>{focusedSkill.label}</strong><p>Capability level {focusedSkill.level}/5</p></div>}</div><div className="scene-stage"><SceneRenderer document={document} execute={execute} reducedMotion={reducedMotion} /><div className="scene-caption"><Volume2 size={14} /><span>{sceneHint}</span></div></div></div><PortfolioSections document={document} editing onOpenPage={(itemId) => onNavigate({ section: "site pages", itemId })} /></div>;
}

function StudioBlogIndex({ document, onNavigate }: { document: SiteDocument; onNavigate: (target: PreviewTarget) => void }) {
  return <div className="portfolio-preview content-draft-preview studio-blog-index"><button type="button" className="preview-back-button" onClick={() => onNavigate({ section: "hero" })}>← Back to homepage preview</button><section className="blog-index"><header><p className="section-eyebrow">BLOG LISTING PREVIEW</p><h1>Ideas, process and field notes</h1><p>Draft and published articles by {document.identity.name}</p></header>{document.publishing.posts.length ? <div>{document.publishing.posts.map((post) => { const cover = document.media.assets.find((asset) => asset.id === post.coverMediaId); return <article key={post.id}>{cover && <div className="blog-card-cover"><Image src={cover.url} alt={cover.alt} fill sizes="430px" unoptimized /></div>}<div><span>{post.status}</span><h2>{post.title}</h2><p>{post.excerpt || "Add an excerpt to introduce this article."}</p><button type="button" onClick={() => onNavigate({ section: "blog posts", itemId: post.id })}>Open article preview</button></div></article>; })}</div> : <div className="portfolio-empty-state">Create an article to populate this Blog listing.</div>}</section></div>;
}

function beginResize(event: React.PointerEvent, initial: number, update: (value: number) => void, min: number, max: number, direction: 1 | -1) {
  event.preventDefault();
  const origin = event.clientX;
  const move = (pointer: PointerEvent) => update(Math.min(max, Math.max(min, initial + (pointer.clientX - origin) * direction)));
  const stop = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
  window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop);
}

function Tab({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return <button type="button" className={active ? "active" : ""} onClick={onClick}>{icon}{label}</button>;
}

function initialsFavicon(name: string, accent: string) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VF";
  const colors: Record<string, string> = { cyan: "#4deeea", violet: "#a78bfa", coral: "#fb7185", lime: "#a3e635" };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${colors[accent] ?? colors.cyan}"/><text x="32" y="41" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="800" fill="#061013">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
