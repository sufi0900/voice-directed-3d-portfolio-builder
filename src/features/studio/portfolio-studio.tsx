"use client";

import dynamic from "next/dynamic";
import { Eye, Layers3, Palette, Redo2, RotateCcw, Save, Type, Undo2, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { SiteCommand } from "@/domain/commands";
import { ManualControls } from "./manual-controls";
import { initialStudioState, studioReducer } from "./studio-reducer";
import { useAssemblyAIAgent } from "@/features/voice/use-assemblyai-agent";
import { VoicePanel } from "@/features/voice/voice-panel";

const OrbitalShowcase = dynamic(() => import("@/features/scene/orbital-showcase").then((module) => module.OrbitalShowcase), {
  ssr: false,
  loading: () => <div className="scene-loading">Preparing Orbital Showcase…</div>,
});

const STORAGE_KEY = "voxfolio-demo-document-v1";
const backgroundClass = { midnight: "bg-midnight", ink: "bg-ink", plum: "bg-plum", cloud: "bg-cloud" } as const;

export function PortfolioStudio() {
  const [state, dispatch] = useReducer(studioReducer, initialStudioState);
  const [saved, setSaved] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    let stored: unknown;
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"); } catch { stored = undefined; }
    dispatch({ type: "hydrate", document: stored });
    return () => preference.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.present));
    setSaved(false);
    const timer = window.setTimeout(() => setSaved(true), 260);
    return () => window.clearTimeout(timer);
  }, [state.hydrated, state.present]);

  const executeManual = useCallback((command: SiteCommand) => dispatch({ type: "execute", command, source: "manual" }), []);
  const executeVoice = useCallback((command: SiteCommand) => dispatch({ type: "execute", command, source: "voice" }), []);
  const undoVoice = useCallback(() => dispatch({ type: "undo", source: "voice" }), []);
  const voice = useAssemblyAIAgent({ document: state.present, execute: executeVoice, undo: undoVoice });
  const focusedSkill = useMemo(() => state.present.skills.find((skill) => skill.id === state.present.scene.focusedSkill), [state.present]);

  return (
    <main className={`studio ${backgroundClass[state.present.design.background]} ${previewOnly ? "preview-only" : ""}`} data-accent={state.present.design.accent}>
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Layers3 size={19} /></span><div><strong>VOXFOLIO</strong><small>3D PORTFOLIO STUDIO</small></div></div>
        <div className="project-state"><span className={saved ? "saved" : "saving"}><Save size={14} />{saved ? "Saved locally" : "Saving…"}</span><i />Revision {state.present.revision}</div>
        <div className="top-actions">
          <button type="button" onClick={() => dispatch({ type: "undo", source: "manual" })} disabled={!state.past.length} aria-label="Undo"><Undo2 size={17} /></button>
          <button type="button" onClick={() => dispatch({ type: "redo" })} disabled={!state.future.length} aria-label="Redo"><Redo2 size={17} /></button>
          <button type="button" className="preview-button" onClick={() => setPreviewOnly((value) => !value)}><Eye size={16} />{previewOnly ? "Exit preview" : "Preview"}</button>
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
    </main>
  );
}

function Tab({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return <button type="button" className={active ? "active" : ""} onClick={onClick}>{icon}{label}</button>;
}
