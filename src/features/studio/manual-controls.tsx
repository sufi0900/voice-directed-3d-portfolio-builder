"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { SiteCommand } from "@/domain/commands";
import type { SiteDocument } from "@/domain/site-document";

type Props = { document: SiteDocument; execute: (command: SiteCommand) => void; panel: "content" | "design" | "scene" };

export function ManualControls({ document, execute, panel }: Props) {
  const [newSkill, setNewSkill] = useState("");

  if (panel === "content") return (
    <div className="control-stack">
      <BufferedField label="Name" value={document.identity.name} maxLength={60} onCommit={(value) => execute({ type: "identity.set", field: "name", value })} />
      <BufferedField label="Professional role" value={document.identity.role} maxLength={80} onCommit={(value) => execute({ type: "identity.set", field: "role", value })} />
      <BufferedField label="Introduction" value={document.identity.intro} maxLength={220} multiline onCommit={(value) => execute({ type: "identity.set", field: "intro", value })} />
      <BufferedField label="Availability" value={document.identity.availability} maxLength={80} onCommit={(value) => execute({ type: "identity.set", field: "availability", value })} />
      <section className="skill-editor" aria-labelledby="skill-editor-title">
        <div className="skill-editor-heading"><div><strong id="skill-editor-title">Featured skills</strong><small>Shown as interactive nodes in the 3D scene.</small></div><span>{document.skills.length}/8</span></div>
        <div className="skill-list">
          {document.skills.map((skill) => <div className="skill-row" key={skill.id}>
            <BufferedInput ariaLabel={`Edit ${skill.label}`} value={skill.label} maxLength={32} onCommit={(label) => execute({ type: "skill.update", skillId: skill.id, label })} />
            <label className="skill-level"><span>Level</span><select aria-label={`${skill.label} level`} value={skill.level} onChange={(event) => execute({ type: "skill.update", skillId: skill.id, level: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map((level) => <option key={level}>{level}</option>)}</select></label>
            <button type="button" className="icon-action danger" aria-label={`Remove ${skill.label}`} disabled={document.skills.length <= 3} onClick={() => execute({ type: "skill.remove", skillId: skill.id })}><Trash2 size={15} /></button>
          </div>)}
        </div>
        <div className="skill-add"><input aria-label="New skill" placeholder="Add another skill" value={newSkill} maxLength={32} onChange={(event) => setNewSkill(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && newSkill.trim()) { event.preventDefault(); execute({ type: "skill.add", label: newSkill }); setNewSkill(""); } }} /><button type="button" disabled={!newSkill.trim() || document.skills.length >= 8} onClick={() => { execute({ type: "skill.add", label: newSkill }); setNewSkill(""); }}><Plus size={15} />Add</button></div>
      </section>
      <p className="guardrail-note">Text edits save when you leave a field or five seconds after typing stops. This keeps undo history meaningful.</p>
    </div>
  );

  if (panel === "design") return (
    <div className="control-stack">
      <Select label="Accent" value={document.design.accent} options={["cyan", "violet", "coral", "lime"]} onChange={(value) => execute({ type: "design.setAccent", value: value as never })} />
      <Select label="Background" value={document.design.background} options={["midnight", "ink", "plum", "cloud"]} onChange={(value) => execute({ type: "design.setBackground", value: value as never })} />
      <Select label="Hero alignment" value={document.design.heroAlignment} options={["left", "center", "right"]} onChange={(value) => execute({ type: "design.setHeroAlignment", value: value as never })} />
      <p className="guardrail-note">Only approved design tokens are exposed, so contrast, spacing and hierarchy remain stable.</p>
    </div>
  );

  return (
    <div className="control-stack">
      <Select label="Scene preset" value={document.scene.preset} options={["cosmic", "architect", "minimal"]} onChange={(value) => execute({ type: "scene.setPreset", value: value as never })} />
      <Select label="Motion" value={document.scene.motion} options={["calm", "dynamic", "still"]} onChange={(value) => execute({ type: "scene.setMotion", value: value as never })} />
      <Field label={`Visual intensity · ${Math.round(document.scene.intensity * 100)}%`}><input type="range" min="0.4" max="1.4" step="0.1" value={document.scene.intensity} onChange={(event) => execute({ type: "scene.setIntensity", value: Number(event.target.value) })} /></Field>
      <Field label="Focus a skill"><select value={document.scene.focusedSkill ?? ""} onChange={(event) => execute({ type: "scene.focusSkill", skillId: event.target.value || null })}><option value="">No focus</option>{document.skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.label}</option>)}</select></Field>
      <p className="guardrail-note">The scene is parameter-driven. Voice and manual controls never generate or execute Three.js code.</p>
    </div>
  );
}

function BufferedInput({ value, maxLength, onCommit, ariaLabel }: { value: string; maxLength: number; onCommit: (value: string) => void; ariaLabel: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft.trim() === value || !draft.trim()) return;
    const timer = window.setTimeout(() => onCommit(draft.trim()), 5_000);
    return () => window.clearTimeout(timer);
  }, [draft, onCommit, value]);
  const commit = () => { const next = draft.trim(); if (!next) setDraft(value); else if (next !== value) onCommit(next); };
  return <input aria-label={ariaLabel} value={draft} maxLength={maxLength} onChange={(event) => setDraft(event.target.value)} onBlur={commit} />;
}

function BufferedField({ label, value, maxLength, multiline = false, onCommit }: { label: string; value: string; maxLength: number; multiline?: boolean; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft.trim() === value || !draft.trim()) return;
    const timer = window.setTimeout(() => onCommit(draft.trim()), 5_000);
    return () => window.clearTimeout(timer);
  }, [draft, onCommit, value]);
  const commit = () => { const next = draft.trim(); if (!next) setDraft(value); else if (next !== value) onCommit(next); };
  return <Field label={label}>{multiline ? <textarea value={draft} maxLength={maxLength} rows={5} onChange={(event) => setDraft(event.target.value)} onBlur={commit} /> : <input value={draft} maxLength={maxLength} onChange={(event) => setDraft(event.target.value)} onBlur={commit} />}</Field>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <Field label={label}><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></Field>; }
