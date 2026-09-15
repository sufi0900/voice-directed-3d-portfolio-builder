"use client";

import type { SiteCommand } from "@/domain/commands";
import type { SiteDocument } from "@/domain/site-document";

type Props = { document: SiteDocument; execute: (command: SiteCommand) => void; panel: "content" | "design" | "scene" };

export function ManualControls({ document, execute, panel }: Props) {
  if (panel === "content") return (
    <div className="control-stack">
      <Field label="Name"><input value={document.identity.name} maxLength={60} onChange={(event) => execute({ type: "identity.set", field: "name", value: event.target.value || " " })} /></Field>
      <Field label="Professional role"><input value={document.identity.role} maxLength={80} onChange={(event) => execute({ type: "identity.set", field: "role", value: event.target.value || " " })} /></Field>
      <Field label="Introduction"><textarea value={document.identity.intro} maxLength={220} rows={5} onChange={(event) => execute({ type: "identity.set", field: "intro", value: event.target.value || " " })} /></Field>
      <Field label="Availability"><input value={document.identity.availability} maxLength={80} onChange={(event) => execute({ type: "identity.set", field: "availability", value: event.target.value || " " })} /></Field>
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
      <Field label={`Visual intensity · ${Math.round(document.scene.intensity * 100)}%`}>
        <input type="range" min="0.4" max="1.4" step="0.1" value={document.scene.intensity} onChange={(event) => execute({ type: "scene.setIntensity", value: Number(event.target.value) })} />
      </Field>
      <Field label="Focus a skill">
        <select value={document.scene.focusedSkill ?? ""} onChange={(event) => execute({ type: "scene.focusSkill", skillId: event.target.value || null })}>
          <option value="">No focus</option>
          {document.skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.label}</option>)}
        </select>
      </Field>
      <p className="guardrail-note">The scene is parameter-driven. Voice and manual controls never generate or execute Three.js code.</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <Field label={label}><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></Field>;
}
