"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { SiteCommand } from "@/domain/commands";
import type { SiteDocument } from "@/domain/site-document";
import { PublishingEditor } from "./publishing-editor";
import { deriveImageAlt } from "@/domain/media";
import { TEMPLATE_CONTRACTS } from "@/domain/template-contracts";

export type PreviewTarget = { section: string; itemId?: string };
type Props = { document: SiteDocument; execute: (command: SiteCommand) => void; panel: "content" | "design" | "scene"; canUploadMedia?: boolean; previewTarget?: PreviewTarget; onPreviewTarget?: (target: PreviewTarget) => void };

export function ManualControls({ document, execute, panel, canUploadMedia = false, previewTarget, onPreviewTarget }: Props) {
  const [newSkill, setNewSkill] = useState("");
  const contentSection = previewTarget?.section ?? "hero";
  const selectContentSection = (section: string) => {
    const itemId = section === "site pages" ? document.publishing.pages[0]?.id : section === "blog posts" ? document.publishing.posts[0]?.id : undefined;
    onPreviewTarget?.({ section, itemId });
  };

  if (panel === "content") return (
    <div className="control-stack">
      <Select label="Editing" value={contentSection} options={["hero", "about", "experience", "education", "skills", "projects", "site pages", "blog posts", "contact", "page structure", "media library"]} onChange={selectContentSection} />
      {contentSection === "hero" && <>
        <BufferedField label="Name" value={document.identity.name} maxLength={60} onCommit={(value) => execute({ type: "identity.set", field: "name", value })} />
        <BufferedField label="Professional role" value={document.identity.role} maxLength={80} onCommit={(value) => execute({ type: "identity.set", field: "role", value })} />
        <BufferedField label="Introduction" value={document.identity.intro} maxLength={220} multiline onCommit={(value) => execute({ type: "identity.set", field: "intro", value })} />
        <BufferedField label="Availability" value={document.identity.availability} maxLength={80} onCommit={(value) => execute({ type: "identity.set", field: "availability", value })} />
      </>}
      {contentSection === "about" && <>
        <HeadshotUploader document={document} execute={execute} enabled={canUploadMedia} />
        <BufferedField label="Section heading" value={document.content.about.heading} maxLength={80} onCommit={(value) => execute({ type: "content.setAbout", field: "heading", value })} />
        <BufferedField label="Professional overview" value={document.content.about.body} maxLength={900} multiline allowEmpty onCommit={(value) => execute({ type: "content.setAbout", field: "body", value })} />
        {document.publishing.pages.some((page) => page.slug === "about") ? <div className="detail-page-ready"><p className="guardrail-note">Your detailed About page is available under Content → Site pages. The homepage keeps this shorter overview for a balanced layout.</p><button type="button" className="secondary-action" onClick={() => { const page = document.publishing.pages.find((entry) => entry.slug === "about"); if (page) onPreviewTarget?.({ section: "site pages", itemId: page.id }); }}>Preview detailed About page</button></div> : <button type="button" className="create-detail-page" onClick={() => execute({ type: "publishing.add", kind: "page", title: "About" })}><Plus size={15} />Create detailed About page</button>}
      </>}
      {contentSection === "experience" && <section className="collection-editor"><header><div><strong>Experience</strong><small>{document.content.experience.length}/8 entries</small></div><button type="button" disabled={document.content.experience.length >= 8} onClick={() => execute({ type: "experience.add" })}><Plus size={15} />Add</button></header>{document.content.experience.map((item) => <article key={item.id}>
        <div className="collection-title"><strong>{item.role}</strong><button type="button" aria-label={`Remove ${item.role}`} onClick={() => execute({ type: "experience.remove", itemId: item.id })}><Trash2 size={14} /></button></div>
        <BufferedField label="Role" value={item.role} maxLength={100} onCommit={(value) => execute({ type: "experience.update", itemId: item.id, field: "role", value })} />
        <BufferedField label="Organization" value={item.organization} maxLength={100} allowEmpty onCommit={(value) => execute({ type: "experience.update", itemId: item.id, field: "organization", value })} />
        <BufferedField label="Period" value={item.period} maxLength={80} allowEmpty onCommit={(value) => execute({ type: "experience.update", itemId: item.id, field: "period", value })} />
        <BufferedField label="Summary" value={item.summary} maxLength={500} multiline allowEmpty onCommit={(value) => execute({ type: "experience.update", itemId: item.id, field: "summary", value })} />
      </article>)}</section>}
      {contentSection === "skills" &&
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
      </section>}
      {contentSection === "education" && <section className="collection-editor"><header><div><strong>Education</strong><small>{document.content.education.length}/8 entries</small></div><button type="button" disabled={document.content.education.length >= 8} onClick={() => execute({ type: "education.add" })}><Plus size={15} />Add</button></header>{document.content.education.map((item) => <article key={item.id}>
        <div className="collection-title"><strong>{item.credential}</strong><button type="button" aria-label={`Remove ${item.credential}`} onClick={() => execute({ type: "education.remove", itemId: item.id })}><Trash2 size={14} /></button></div>
        <BufferedField label="Credential" value={item.credential} maxLength={140} onCommit={(value) => execute({ type: "education.update", itemId: item.id, field: "credential", value })} />
        <BufferedField label="Institution" value={item.institution} maxLength={120} allowEmpty onCommit={(value) => execute({ type: "education.update", itemId: item.id, field: "institution", value })} />
        <BufferedField label="Period" value={item.period} maxLength={80} allowEmpty onCommit={(value) => execute({ type: "education.update", itemId: item.id, field: "period", value })} />
        <BufferedField label="Details" value={item.summary} maxLength={500} multiline allowEmpty onCommit={(value) => execute({ type: "education.update", itemId: item.id, field: "summary", value })} />
      </article>)}</section>}
      {contentSection === "projects" && <section className="collection-editor"><header><div><strong>Project case studies</strong><small>{document.content.projects.length}/8 projects</small></div><button type="button" disabled={document.content.projects.length >= 8} onClick={() => execute({ type: "project.add" })}><Plus size={15} />Add</button></header>{document.content.projects.map((item, index) => <article key={item.id}>
        <div className="collection-title"><strong>{item.title}</strong><span className="collection-actions"><button type="button" disabled={index === 0} aria-label={`Move ${item.title} up`} onClick={() => execute({ type: "project.move", itemId: item.id, direction: "up" })}><ArrowUp size={14} /></button><button type="button" disabled={index === document.content.projects.length - 1} aria-label={`Move ${item.title} down`} onClick={() => execute({ type: "project.move", itemId: item.id, direction: "down" })}><ArrowDown size={14} /></button><button type="button" aria-label={`Remove ${item.title}`} onClick={() => execute({ type: "project.remove", itemId: item.id })}><Trash2 size={14} /></button></span></div>
        <BufferedField label="Project title" value={item.title} maxLength={100} onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "title", value })} />
        <BufferedField label="Summary" value={item.summary} maxLength={500} multiline allowEmpty onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "summary", value })} />
        <BufferedField label="Case-study slug" value={item.caseStudySlug} maxLength={80} onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "caseStudySlug", value })} />
        <BufferedField label="Your role" value={item.role} maxLength={100} allowEmpty onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "role", value })} />
        <BufferedField label="Period" value={item.period} maxLength={80} allowEmpty onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "period", value })} />
        <BufferedField label="Challenge" value={item.challenge} maxLength={1200} multiline allowEmpty onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "challenge", value })} />
        <BufferedField label="Approach" value={item.approach} maxLength={1800} multiline allowEmpty onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "approach", value })} />
        <BufferedField label="Outcome" value={item.outcome} maxLength={1200} multiline allowEmpty onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "outcome", value })} />
        <BufferedField label="Technologies (comma separated)" value={item.technologies.join(", ")} maxLength={260} allowEmpty onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "technologies", value: value.split(",").map((entry) => entry.trim()).filter(Boolean) })} />
        <BufferedField label="Project URL" value={item.link} maxLength={300} allowEmpty onCommit={(value) => execute({ type: "project.update", itemId: item.id, field: "link", value })} />
        <ProjectGallery project={item} document={document} execute={execute} />
      </article>)}</section>}
      {contentSection === "media library" && <MediaLibrary document={document} execute={execute} enabled={canUploadMedia} />}
      {contentSection === "site pages" && <PublishingEditor key="site-pages" document={document} execute={execute} kind="page" canUploadMedia={canUploadMedia} selectedItemId={previewTarget?.itemId} onSelect={(itemId) => onPreviewTarget?.({ section: "site pages", itemId })} />}
      {contentSection === "blog posts" && <PublishingEditor key="blog-posts" document={document} execute={execute} kind="post" canUploadMedia={canUploadMedia} selectedItemId={previewTarget?.itemId} onSelect={(itemId) => onPreviewTarget?.({ section: "blog posts", itemId })} />}
      {contentSection === "contact" && <>
        <BufferedField label="Section heading" value={document.content.contact.heading} maxLength={100} onCommit={(value) => execute({ type: "content.setContact", field: "heading", value })} />
        <BufferedField label="Email" value={document.content.contact.email} maxLength={120} allowEmpty onCommit={(value) => execute({ type: "content.setContact", field: "email", value })} />
        <BufferedField label="Location" value={document.content.contact.location} maxLength={100} allowEmpty onCommit={(value) => execute({ type: "content.setContact", field: "location", value })} />
        <BufferedField label="Button label" value={document.content.contact.cta} maxLength={60} onCommit={(value) => execute({ type: "content.setContact", field: "cta", value })} />
      </>}
      {contentSection === "page structure" && <section className="section-manager"><p>Reorder sections or hide them from the live portfolio.</p>{document.content.order.map((section, index) => <div key={section}><span>{section}</span><button type="button" disabled={index === 0} aria-label={`Move ${section} up`} onClick={() => execute({ type: "section.move", section, direction: "up" })}><ArrowUp size={14} /></button><button type="button" disabled={index === document.content.order.length - 1} aria-label={`Move ${section} down`} onClick={() => execute({ type: "section.move", section, direction: "down" })}><ArrowDown size={14} /></button><button type="button" aria-label={`${document.content.visibility[section] ? "Hide" : "Show"} ${section}`} onClick={() => execute({ type: "section.setVisible", section, value: !document.content.visibility[section] })}>{document.content.visibility[section] ? <Eye size={14} /> : <EyeOff size={14} />}</button></div>)}</section>}
      <p className="guardrail-note">Text edits save when you leave a field or five seconds after typing stops. This keeps undo history meaningful.</p>
    </div>
  );

  if (panel === "design") return (
    <div className="control-stack">
      <section className="studio-template-picker" aria-labelledby="template-picker-title"><header><strong id="template-picker-title">Portfolio template</strong><small>Switch presentation without replacing any content.</small></header><div>{TEMPLATE_CONTRACTS.map((template) => <button type="button" key={template.id} className={document.design.template === template.id ? "selected" : ""} aria-pressed={document.design.template === template.id} onClick={() => execute({ type: "design.setTemplate", value: template.id })}><i aria-hidden="true" /><span><strong>{template.name}</strong><small>{template.description}</small></span></button>)}</div></section>
      <Select label="Accent" value={document.design.accent} options={["cyan", "violet", "coral", "lime"]} onChange={(value) => execute({ type: "design.setAccent", value: value as never })} />
      <Select label="Background" value={document.design.background} options={["midnight", "ink", "plum", "cloud"]} onChange={(value) => execute({ type: "design.setBackground", value: value as never })} />
      <Select label="Hero alignment" value={document.design.heroAlignment} options={["left", "center", "right"]} onChange={(value) => execute({ type: "design.setHeroAlignment", value: value as never })} />
      <p className="guardrail-note">Only approved design tokens are exposed, so contrast, spacing and hierarchy remain stable.</p>
    </div>
  );

  return (
    <div className="control-stack">
      <Select label="Scene family" value={document.scene.family} options={["orbital-showcase", "constellation-field"]} onChange={(value) => execute({ type: "scene.setFamily", value: value as never })} />
      <Select label="Scene preset" value={document.scene.preset} options={["cosmic", "architect", "minimal"]} onChange={(value) => execute({ type: "scene.setPreset", value: value as never })} />
      <Select label="Motion" value={document.scene.motion} options={["calm", "dynamic", "still"]} onChange={(value) => execute({ type: "scene.setMotion", value: value as never })} />
      <Field label={`Visual intensity · ${Math.round(document.scene.intensity * 100)}%`}><input type="range" min="0.4" max="1.4" step="0.1" value={document.scene.intensity} onChange={(event) => execute({ type: "scene.setIntensity", value: Number(event.target.value) })} /></Field>
      <Field label="Focus a skill"><select value={document.scene.focusedSkill ?? ""} onChange={(event) => execute({ type: "scene.focusSkill", skillId: event.target.value || null })}><option value="">No focus</option>{document.skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.label}</option>)}</select></Field>
      <p className="guardrail-note">The scene is parameter-driven. Voice and manual controls never generate or execute Three.js code.</p>
    </div>
  );
}

function MediaLibrary({ document, execute, enabled }: { document: SiteDocument; execute: (command: SiteCommand) => void; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [alt, setAlt] = useState("");
  async function upload(file: File) {
    if (document.media.assets.length >= 24) return setError("The media library is full. Remove an unused image first.");
    setBusy(true); setError("");
    const generatedAlt = deriveImageAlt(file.name, alt);
    const data = new FormData(); data.set("image", file); data.set("alt", generatedAlt);
    try {
      const response = await fetch(`/api/projects/${document.projectId}/media`, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) return setError(result.error ?? "Could not upload this image.");
      execute({ type: "media.addAsset", asset: result.asset }); setAlt("");
    } catch { setError("The image upload was interrupted."); }
    finally { setBusy(false); }
  }
  return <section className="media-library-editor"><header><div><strong>Reusable media library</strong><small>{document.media.assets.length}/24 images · JPG, PNG, or WebP · 3 MB each</small></div></header>
    {enabled ? <><div className="media-upload-box"><input aria-label="Image alternative text" placeholder="Optional now—review after upload" value={alt} maxLength={180} onChange={(event) => setAlt(event.target.value)} /><label className="headshot-upload"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || document.media.assets.length >= 24} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} />{busy ? "Uploading…" : document.media.assets.length >= 24 ? "Library full" : "Upload image"}</label></div><small className="upload-help">Alternative text is optional before upload and editable afterward.</small></> : <p className="guardrail-note">Save this portfolio to your account before uploading project images.</p>}
    {error && <p className="form-message">{error}</p>}
    <div className="media-library-grid">{document.media.assets.map((asset) => <article key={asset.id}><div><Image src={asset.url} alt={asset.alt} fill sizes="120px" unoptimized /></div><BufferedField label="Alternative text" value={asset.alt} maxLength={180} onCommit={(value) => execute({ type: "media.updateAsset", mediaId: asset.id, alt: value })} /><button type="button" className="danger-action" onClick={() => execute({ type: "media.removeAsset", mediaId: asset.id })}><Trash2 size={14} />Remove from library</button></article>)}</div>
  </section>;
}

function ProjectGallery({ project, document, execute }: { project: SiteDocument["content"]["projects"][number]; document: SiteDocument; execute: (command: SiteCommand) => void }) {
  return <div className="project-gallery-editor"><strong>Case-study gallery</strong><small>Upload directly from the Media library section or select up to eight existing images here.</small>{document.media.assets.length ? <div>{document.media.assets.map((asset) => { const selected = project.mediaIds.includes(asset.id); return <label key={asset.id} className={selected ? "selected" : ""}><Image src={asset.url} alt="" fill sizes="72px" unoptimized /><input type="checkbox" checked={selected} disabled={!selected && project.mediaIds.length >= 8} onChange={() => execute({ type: selected ? "project.detachMedia" : "project.attachMedia", itemId: project.id, mediaId: asset.id })} /><span>{asset.alt}</span></label>; })}</div> : <p>No images uploaded yet. Use Content → Media library, then return here to attach them.</p>}</div>;
}

function HeadshotUploader({ document, execute, enabled }: { document: SiteDocument; execute: (command: SiteCommand) => void; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file: File) {
    setBusy(true); setError("");
    const data = new FormData(); data.set("headshot", file);
    try {
      const response = await fetch(`/api/projects/${document.projectId}/headshot`, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) return setError(result.error ?? "Could not upload the headshot.");
      execute({ type: "media.setHeadshot", url: result.url, alt: `${document.identity.name} headshot` });
    } catch { setError("The headshot upload was interrupted."); }
    finally { setBusy(false); }
  }
  return <section className="headshot-editor"><div className="headshot-preview">{document.media.headshotUrl ? <Image src={document.media.headshotUrl} alt={document.media.headshotAlt || `${document.identity.name} headshot`} fill sizes="88px" unoptimized /> : <span>{initials(document.identity.name)}</span>}</div><div><strong>About headshot</strong><small>JPG, PNG, or WebP · maximum 3 MB</small>{enabled ? <label className="headshot-upload"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />{busy ? "Uploading…" : document.media.headshotUrl ? "Replace image" : "Upload image"}</label> : <small>Save this portfolio to your account before uploading media.</small>}{document.media.headshotUrl && <button type="button" onClick={() => execute({ type: "media.setHeadshot", url: "", alt: "" })}>Remove</button>}{error && <em>{error}</em>}</div></section>;
}

function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VF"; }

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

function BufferedField({ label, value, maxLength, multiline = false, allowEmpty = false, onCommit }: { label: string; value: string; maxLength: number; multiline?: boolean; allowEmpty?: boolean; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft.trim() === value || (!allowEmpty && !draft.trim())) return;
    const timer = window.setTimeout(() => onCommit(draft.trim()), 5_000);
    return () => window.clearTimeout(timer);
  }, [allowEmpty, draft, onCommit, value]);
  const commit = () => { const next = draft.trim(); if (!allowEmpty && !next) setDraft(value); else if (next !== value) onCommit(next); };
  return <Field label={label}>{multiline ? <textarea value={draft} maxLength={maxLength} rows={5} onChange={(event) => setDraft(event.target.value)} onBlur={commit} /> : <input value={draft} maxLength={maxLength} onChange={(event) => setDraft(event.target.value)} onBlur={commit} />}</Field>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <Field label={label}><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></Field>; }
