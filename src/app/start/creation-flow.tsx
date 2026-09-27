"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isCollectionTemplate } from "@/domain/template-contracts";
import { CollectionHero, CollectionSections } from "@/features/portfolio/collection-templates";
import { PORTFOLIO_TEMPLATES } from "@/domain/templates";
import type { CvCandidate } from "@/domain/cv-ingestion";
import type { GuidedInterview } from "@/domain/guided-interview";
import { GuidedInterviewPanel } from "./guided-interview";
import { VoxGuidedInterview } from "./vox-guided-interview";
import { emptyVoiceOnboarding, isVoiceDraftReady, parseCoreSkills, voiceOnboardingSchema, type VoiceOnboarding } from "@/domain/voice-onboarding";
import { describeCreationIssue, guidedCreateSchema, selectedFirstProject } from "@/domain/project-creation";

type Mode = "guided" | "manual" | "template";

export function CreationFlow({ authenticated, suggestedName = "", ownerId = "guest" }: { authenticated: boolean; suggestedName?: string; ownerId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [busy, setBusy] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const [error, setError] = useState("");
  const creating = useRef(false);
  const createdProject = useRef<string | null>(null);
  const [templateId, setTemplateId] = useState(PORTFOLIO_TEMPLATES[0].id);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [cvNotice, setCvNotice] = useState("");
  const [cvSource, setCvSource] = useState<{ sourceId: string; fileName: string; mediaType: string } | null>(null);
  const [cvCandidates, setCvCandidates] = useState<Array<CvCandidate & { approved: boolean }>>([]);
  const [interview, setInterview] = useState<Partial<GuidedInterview>>({});
  const [voiceState, setVoiceState] = useState<VoiceOnboarding>(emptyVoiceOnboarding);
  const [manualSelection, setManualSelection] = useState<{ id: number; description: string }>();
  const [form, setForm] = useState({ projectName: suggestedName ? `${suggestedName} Portfolio`.slice(0,80) : "My portfolio", name: suggestedName, role: "", intro: "", skills: "", education: "", website: "" });
  const selectedTemplate = PORTFOLIO_TEMPLATES.find((template) => template.id === templateId) ?? PORTFOLIO_TEMPLATES[0];
  const voiceDesignReady = Boolean(voiceState.confirmed.name && voiceState.confirmed.role && voiceState.confirmed.intro && voiceState.confirmed.skills);
  const templateAnchor = useRef<HTMLDivElement>(null);
  const [skillsError, setSkillsError] = useState("");
  const [skillEntries, setSkillEntries] = useState<string[]>(["", ""]);
  const voiceTemplatesReady = voiceDesignReady && Object.keys(voiceState.direction).length === 5;
  useEffect(() => {
    if (mode === "guided" && voiceTemplatesReady && !voiceState.selectedTemplate) templateAnchor.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [mode, voiceTemplatesReady, voiceState.selectedTemplate]);
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`voxfolio-creation:${ownerId}`);
      if (stored) {
        const parsed = (awaitVoiceState(JSON.parse(stored)));
        setVoiceState(parsed);
        if (parsed.confirmed.skills) setSkillEntries(parsed.confirmed.skills.split(",").map(skill => skill.trim()));
        if (parsed.selectedTemplate) setTemplateId(parsed.selectedTemplate);
        setInterview(parsed.direction);
        setForm(current => ({ ...current, ...Object.fromEntries(Object.entries(parsed.confirmed).filter(([key]) => ["name","role","intro","skills","education","website"].includes(key))) }));
      }
    } catch { /* A damaged temporary interview never overrides the creation form. */ }
  }, [ownerId]);
  function updateVoice(next: VoiceOnboarding) {
    setVoiceState(next);
    setError("");
    setSkillsError("");
    if (next.confirmed.skills) setSkillEntries(next.confirmed.skills.split(",").map(skill => skill.trim()));
    if (next.selectedTemplate) setTemplateId(next.selectedTemplate);
    setInterview(next.direction);
    setForm(current => ({ ...current, ...Object.fromEntries(Object.entries(next.confirmed).filter(([key]) => ["name","role","intro","skills","education","website"].includes(key))), projectName: current.projectName === "My portfolio" && next.confirmed.name ? `${next.confirmed.name} Portfolio`.slice(0,80) : current.projectName }));
    try { sessionStorage.setItem(`voxfolio-creation:${ownerId}`, JSON.stringify(next)); } catch { /* The open tab still retains confirmed values. */ }
  }
  function approveTypedRequired(field: "name" | "role" | "intro") {
    const value = form[field].trim().replace(/\s+/g," ");
    if (!value) { setError(`${field === "role" ? "Professional role" : field} cannot be empty.`); return; }
    const next = { ...voiceState, confirmed: { ...voiceState.confirmed, [field]: value }, pending: voiceState.pending?.field === field ? null : voiceState.pending };
    updateVoice(next);
    setManualSelection({ id: Date.now(), description: `The user typed and confirmed ${field} as ${value}. This exact field is complete. Continue with ${field === "name" ? "professional role" : field === "role" ? "introduction" : "core skills"}, not an earlier question.` });
  }
  function saveSkillEntries(entries: string[]) {
    try {
      const normalized = parseCoreSkills(entries.join(", "));
      updateVoice({ ...voiceState, confirmed: { ...voiceState.confirmed, skills: normalized.join(", ") }, pending: voiceState.pending?.field === "skills" ? null : voiceState.pending });
      setSkillEntries(normalized);
      setManualSelection({ id: Date.now(), description: `The user entered and confirmed these core skills: ${normalized.join(", ")}. Continue with the design questions.` });
    } catch (cause) { setSkillsError(cause instanceof Error ? cause.message : "Review each skill."); }
  }
  function skipOptional(field: "skills" | "education" | "website") {
    if (field === "skills") { setSkillsError("Add at least two core skills before continuing."); return; }
    const confirmed = { ...voiceState.confirmed }; delete confirmed[field];
    updateVoice({ ...voiceState, confirmed, pending: voiceState.pending?.field === field ? null : voiceState.pending });
    setForm(previous => ({ ...previous, [field]: "" }));
  }
  function approveTypedOptional(field: "education" | "website") {
    const exact = form[field].trim();
    const confirmed = { ...voiceState.confirmed };
    if (exact) confirmed[field] = exact;
    else delete confirmed[field];
    updateVoice({ ...voiceState, confirmed });
    setManualSelection({ id: Date.now(), description: exact ? `The user typed the exact optional ${field} on the right: ${exact}. This is approved wording; continue without repeating the question.` : `The user cleared the optional ${field} on the right. Leave it blank and continue.` });
  }

  async function create(fromVoice = false): Promise<{ok: boolean; error?: string; projectId?: string}> {
    if (createdProject.current) return {ok:true,projectId:createdProject.current};
    if (creating.current) return { ok: false, error: "Your private draft is already being saved. Please wait for the result." };
    if (!authenticated) { router.push("/login"); return {ok:false,error:"Sign in to create your private draft."}; }
    if (fromVoice && (mode !== "guided" || !isVoiceDraftReady(voiceState))) return {ok:false,error:"Confirm your name, role, introduction and at least two short core skills, answer all five design questions and select a template before creating the private draft."};
    const cv = cvSource ? {
      ...cvSource,
      importedAt: new Date().toISOString(),
      originalStored: false as const,
      approvedFacts: cvCandidates.filter((item) => item.approved).map((item) => ({ id: item.id, kind: item.kind, value: item.value, sourceExcerpt: item.sourceExcerpt })),
    } : undefined;
    const body = mode === "template" ? { mode, templateId, projectName: form.projectName } : { mode: "guided" as const, templateId, ...form, skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean), education: form.education.split("\n").map((item) => item.trim()).filter(Boolean), cv: mode === "manual" ? cv : undefined, interview, firstProject: mode === "guided" ? selectedFirstProject(voiceState) : undefined };
    if (mode !== "template") {
      if (mode === "guided") { try { parseCoreSkills(form.skills); } catch (cause) { const message = cause instanceof Error ? cause.message : "Review your core skills."; setSkillsError(message); setError(message); return {ok:false,error:message}; } }
      const checked = guidedCreateSchema.safeParse(body);
      if (!checked.success) {
        const message = describeCreationIssue(checked.error.issues[0]); setError(message);
        return {ok:false,error:message};
      }
    }
    creating.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({ error: `The server returned ${response.status} without a readable response.` }));
      if (!response.ok) { const message = result.error ?? "Could not create the project."; setError(message); return {ok:false,error:message}; }
      try { sessionStorage.removeItem(`voxfolio-creation:${ownerId}`); } catch {}
      const projectId: string = result.projectId;
      createdProject.current = projectId;
      if (mode === "guided") window.setTimeout(() => router.push(`/studio/${projectId}?welcome=vox`), 450);
      else router.push(`/studio/${projectId}`);
      return {ok:true,projectId};
    } catch {
      const message = "The save request was interrupted. Check My projects before trying again so you do not create a duplicate draft.";
      setError(message); return {ok:false,error:message};
    } finally { creating.current = false; setBusy(false); }
  }

  async function extractCv() {
    if (!cvFile) return;
    setCvBusy(true); setError(""); setCvNotice(""); setCvCandidates([]);
    try {
      const data = new FormData(); data.set("cv", cvFile); data.set("aiEnhanced", String(aiEnhanced));
      const response = await fetch("/api/cv/extract", { method: "POST", body: data });
      const result = await response.json().catch(() => ({ error: `CV extraction failed with server status ${response.status}.` }));
      if (!response.ok) return setError(result.error ?? "Could not read the CV.");
      setCvSource({ sourceId: result.sourceId, fileName: result.fileName, mediaType: result.mediaType });
      setCvCandidates(result.candidates.map((item: CvCandidate) => ({ ...item, approved: false })));
      setCvNotice(result.notice || (result.engine === "ai-hybrid" ? "AI-enhanced extraction completed and was cross-checked locally." : "Local extraction completed."));
    } catch {
      setError("The CV request was interrupted. Please try again.");
    } finally {
      setCvBusy(false);
    }
  }

  function updateCandidate(index: number, update: Partial<CvCandidate & { approved: boolean }>) {
    setCvCandidates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item));
  }

  function applyApprovedFacts() {
    const approved = cvCandidates.filter((item) => item.approved);
    const value = (kind: CvCandidate["kind"]) => approved.find((item) => item.kind === kind)?.value;
    const skills = approved.filter((item) => item.kind === "skill").map((item) => item.value);
    const education = approved.filter((item) => item.kind === "education").map((item) => item.value);
    setForm((current) => ({ ...current, name: value("name") ?? current.name, role: value("role") ?? current.role, intro: value("intro") ?? current.intro, skills: skills.length ? skills.join(", ") : current.skills, education: education.length ? education.join("\n") : current.education }));
  }

  if (!mode) return <section className="choice-grid">
    <button onClick={() => setMode("guided")}><span>01 · RECOMMENDED</span><h2>Build with Vox</h2><p>Talk through your story. Vox confirms exact details and creates a private, reviewable first draft.</p><b>Start voice creation →</b></button>
    <button onClick={() => setMode("manual")}><span>02 · ACCESSIBLE ALTERNATIVE</span><h2>Use keyboard and text</h2><p>Create with the same guided questions when a microphone is unavailable or precise typing works better.</p><b>Start accessible setup →</b></button>
    <button onClick={() => setMode("template")}><span>03 · EXISTING WORKFLOW</span><h2>Choose a template</h2><p>Begin with a curated visual foundation and customize it in Studio.</p><b>Browse templates →</b></button>
  </section>;

  return <section className="creation-card">
    <button className="text-action back-action" onClick={() => setMode(null)}>← Change creation path</button>
    <p className="eyebrow">{mode === "guided" ? "VOICE-DIRECTED CREATION" : mode === "manual" ? "ACCESSIBLE GUIDED CREATION" : "TEMPLATE LIBRARY"}</p>
    <h1>{mode === "template" ? "Choose a governed foundation" : "Build from your goals"}</h1>
    <label>Project name<input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} maxLength={80} placeholder="e.g. Sufian — Growth Systems Portfolio" /><small className="field-help">Use a distinct name so this portfolio is easy to find later.</small></label>
    {mode !== "template" ? <div className={`guided-fields ${mode === "guided" ? "voice-creation-layout" : ""}`}>
      {mode === "guided" && <VoxGuidedInterview authenticated={authenticated} value={voiceState} onChange={updateVoice} manualSelection={manualSelection} onSkipOptional={skipOptional} onCreateDraft={() => create(true)} saving={busy} creationError={error} />}
      <div className={mode === "guided" ? "voice-creation-detail" : "manual-creation-detail"}>
      {mode === "guided" && <div className="voice-progress" role="status"><strong>Your interview progress</strong><p>{!voiceState.confirmed.name ? "Start by telling Vox your name." : !voiceState.confirmed.role ? "Name confirmed. Tell Vox your professional role." : !voiceState.confirmed.intro ? "Role confirmed. Tell Vox your introduction." : !voiceState.confirmed.skills ? "Add at least two short core skills, then discuss your design." : !voiceTemplatesReady ? `Story confirmed. Discuss your design preferences with Vox (${Object.keys(voiceState.direction).length} of 5).` : voiceState.selectedTemplate ? "Template selected. Optional details can be added now or later. Ask Vox to create your private draft." : "Design choices ready. Review and choose a template on this side."}</p>{voiceState.projectSkipped && <small>First project skipped. You can add one later in Studio.</small>}</div>}
      {mode === "guided" && voiceTemplatesReady && <p className="voice-optional-note">Education, a website link and the first project are optional. Tell Vox about them, type them on the right, or skip them and create a private draft. You can add optional details later in Studio.</p>}
      <h2 className="creation-review-heading">{mode === "guided" ? "Review the details Vox will use" : "Enter and review your details"}</h2>
      <p className="creation-review-help">{mode === "guided" ? "Confirmed spoken answers appear here. You can correct them using your keyboard. A private draft is created only after review." : "Type your exact details, then review the private first draft in Studio."}</p>
      <div className="creation-review-fields">
      <label>Your name<input value={form.name} maxLength={60} onChange={(e) => { setError(""); setForm({ ...form, name: e.target.value }); }} onBlur={() => { if (mode === "guided" && form.name.trim() && form.name.trim() !== voiceState.confirmed.name) approveTypedRequired("name"); }} /><small className="field-help">{mode === "guided" ? "Type an exact spelling and leave this field to confirm it." : "Use your exact spelling."}</small></label>
      {(mode !== "guided" || !!voiceState.confirmed.name) && <label>Professional role<input value={form.role} maxLength={80} onChange={(e) => { setError(""); setForm({ ...form, role: e.target.value }); }} onBlur={() => { if (mode === "guided" && form.role.trim() && form.role.trim() !== voiceState.confirmed.role) approveTypedRequired("role"); }} placeholder="e.g. Web designer" /><small className="field-help">Enter your exact role, then move to the next field.</small></label>}
      {(mode !== "guided" || !!voiceState.confirmed.role) && <label>Short positioning statement<textarea value={form.intro} onChange={(e) => { setError(""); setForm({ ...form, intro: e.target.value }); }} onBlur={() => { if (mode === "guided" && form.intro.trim() && form.intro.trim() !== voiceState.confirmed.intro) approveTypedRequired("intro"); }} maxLength={220} /></label>}
      {mode === "guided" ? (voiceState.confirmed.intro && <div className="core-skills-editor" role="group" aria-label="Core skills"><strong>Core skills · at least 2 required</strong><p className="field-help">Each skill is a separate label of at most 32 characters. Start with two; you can add up to eight.</p>{skillEntries.map((skill,index) => <label key={index}>Skill {index+1}<input value={skill} maxLength={32} onChange={event => { setSkillsError(""); setSkillEntries(current => current.map((value,i) => i === index ? event.target.value : value)); }} placeholder={index === 0 ? "Web design" : "UI design"} />{skillEntries.length > 2 && <button type="button" className="text-action" onClick={() => setSkillEntries(current => current.filter((_,i) => i !== index))}>Remove</button>}</label>)}<div className="core-skills-actions"><button type="button" className="secondary-action" disabled={skillEntries.length >= 8} onClick={() => setSkillEntries(current => [...current, ""])}>Add skill</button><button type="button" className="secondary-action" onClick={() => saveSkillEntries(skillEntries)}>Save core skills</button></div>{skillsError && <p role="alert">{skillsError}</p>}</div>) : <label>Core skills <small className="field-help">Up to eight comma-separated skills; 32 characters each</small><textarea value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} maxLength={300} placeholder="e.g. SEO strategy, Keyword research" /></label>}
      {(mode !== "guided" || !!voiceState.selectedTemplate) && <><label>Education <small className="field-help">Optional · add one credential per line</small><textarea value={form.education} onChange={(e) => { setError(""); setForm({ ...form, education: e.target.value }); }} onBlur={() => { if (mode === "guided") approveTypedOptional("education"); }} maxLength={600} placeholder="e.g. MCS — Abdul Wali Khan University Mardan" /></label><label>Website link <small className="field-help">Optional · this will appear in your contact links</small><input type="url" value={form.website} onChange={(e) => { setError(""); setForm({ ...form, website: e.target.value }); }} onBlur={() => { if (mode === "guided") approveTypedOptional("website"); }} maxLength={300} placeholder="https://yourwebsite.com" /></label></>}
      </div>
      {(mode !== "guided" || voiceTemplatesReady) ? <div ref={templateAnchor} className="template-selection-layout"><div className="template-grid">{PORTFOLIO_TEMPLATES.map((template) => <button type="button" aria-pressed={template.id === templateId && (mode !== "guided" || !!voiceState.selectedTemplate)} className={template.id === templateId && (mode !== "guided" || !!voiceState.selectedTemplate) ? "selected" : ""} key={template.id} onClick={() => { setTemplateId(template.id); if (mode === "guided") { updateVoice({ ...voiceState, selectedTemplate: template.id as VoiceOnboarding["selectedTemplate"] }); setManualSelection({ id: Date.now(), description: `The user selected the ${template.name} template in the right-hand preview. Acknowledge the selection. Tell the user that education, a website link and the first project are optional: they can type them on the right or create their private draft now.` }); } }}><i>{template.mode.toUpperCase()}</i><h3>{template.name}</h3><p>{template.description}</p></button>)}</div><TemplatePreview template={selectedTemplate} /></div> : null}
      {mode === "manual" && <details className="cv-option"><summary>Optional: import CV evidence</summary><section className={`cv-import ${cvBusy ? "is-processing" : ""}`} aria-busy={cvBusy}>
        <div><span className="eyebrow">OPTIONAL CV GROUNDING</span><h2>Import facts, then approve them</h2><p>PDF, DOCX, or TXT · maximum 5 MB. The original file is processed temporarily and is not stored.</p></div>
        <div className="cv-upload-row">
          <input aria-label="Choose CV" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => { setCvFile(event.target.files?.[0] ?? null); setCvSource(null); setCvCandidates([]); }} />
          <button type="button" className="secondary-action" disabled={!cvFile || cvBusy} onClick={extractCv}>{cvBusy ? <><span className="inline-spinner" />Analyzing…</> : "Extract reviewable facts"}</button>
        </div>
        <label className="cv-ai-consent"><input type="checkbox" checked={aiEnhanced} onChange={(event) => setAiEnhanced(event.target.checked)} /><span><strong>Use AI-enhanced extraction</strong><small>Send this CV to OpenAI for layout-aware analysis. The request uses <code>store: false</code>; human approval is still required.</small></span></label>
        {cvNotice && <p className="cv-engine-notice">{cvNotice}</p>}
        {cvCandidates.length > 0 && <div className="cv-review">
          <div className="cv-review-heading"><strong>Review every candidate</strong><span>{cvCandidates.filter((item) => item.approved).length} approved</span></div>
          {cvCandidates.map((item, index) => <label className="cv-fact" key={item.id}>
            <input type="checkbox" checked={item.approved} onChange={(event) => updateCandidate(index, { approved: event.target.checked })} />
            <span>{item.kind}<small>{item.confidence} extraction confidence</small></span>
            <input value={item.value} maxLength={item.kind === "skill" ? 32 : 220} onChange={(event) => updateCandidate(index, { value: event.target.value })} />
          </label>)}
          <button type="button" className="secondary-action" onClick={applyApprovedFacts}>Apply approved portfolio facts</button>
          <p className="cv-privacy">Only checked facts are saved with their source excerpts. Unchecked text and the original file are discarded.</p>
        </div>}
        {cvBusy && <div className="cv-processing" role="status" aria-live="polite"><span className="processing-orbit"><i /><i /><i /></span><strong>Analyzing your CV</strong><small>Reading its structure, identifying evidence, and preparing facts for your approval.</small></div>}
      </section></details>}
      {mode === "manual" && <GuidedInterviewPanel value={interview} onChange={setInterview} groundedFactCount={cvCandidates.filter((item) => item.approved).length} />}
      {mode === "guided" && voiceDesignReady && !voiceState.projectSkipped && <button type="button" className="secondary-action" onClick={() => { const confirmed = { ...voiceState.confirmed }; delete confirmed.projectTitle; delete confirmed.projectSummary; updateVoice({ ...voiceState, confirmed, pending: voiceState.pending?.field === "projectTitle" || voiceState.pending?.field === "projectSummary" ? null : voiceState.pending, projectSkipped: true }); setManualSelection({ id: Date.now(), description: "The user clicked Skip first project. This is optional and was removed from the draft; do not ask for its title or details again." }); }}>Skip first project for now</button>}
      </div>
    </div> : <div className="template-selection-layout"><div className="template-grid">{PORTFOLIO_TEMPLATES.map((template) => <button type="button" aria-pressed={template.id === templateId} className={template.id === templateId ? "selected" : ""} key={template.id} onClick={() => setTemplateId(template.id)}><i>{template.mode.toUpperCase()}</i><h3>{template.name}</h3><p>{template.description}</p><small>{template.audience}</small></button>)}</div><TemplatePreview template={selectedTemplate} /></div>}
    {error && <div className="form-message" role="alert">{error}</div>}
    {busy && <p className="voice-saving-status" role="status"><span className="inline-spinner" /> Saving your private draft… Waiting for the server to confirm.</p>}
    {mode === "guided" && !isVoiceDraftReady(voiceState) && <p className="creation-review-help" role="status">To create with Vox, confirm your name, role, introduction and at least two core skills, then answer the five design questions. Use the accessible text route if voice is unavailable.</p>}
    <button className="primary-action" disabled={busy || !form.projectName || (mode === "guided" && !isVoiceDraftReady(voiceState)) || (mode === "manual" && (!form.name || !form.role || !form.intro || Object.keys(interview).length !== 5))} onClick={() => void create()}>{busy ? "Saving private draft…" : authenticated ? "Create private portfolio draft" : "Sign in to create"}</button>
  </section>;
}

function awaitVoiceState(value: unknown): VoiceOnboarding {
  const parsed = voiceOnboardingSchema.safeParse(value);
  if (!parsed.success) return emptyVoiceOnboarding();
  if (parsed.data.confirmed.skills) { try { parseCoreSkills(parsed.data.confirmed.skills); } catch { const confirmed = { ...parsed.data.confirmed }; delete confirmed.skills; return { ...parsed.data, confirmed, pending: parsed.data.pending?.field === "skills" ? null : parsed.data.pending }; } }
  return parsed.data;
}

function TemplatePreview({ template }: { template: (typeof PORTFOLIO_TEMPLATES)[number] }) {
  const document = template.document;
  if (isCollectionTemplate(template.id)) return <aside className={`template-library-preview template-${template.id} collection-theme`} data-accent={document.design.accent} aria-live="polite"><header><strong>{template.name}</strong><span>Scroll to explore</span></header><div className={`portfolio-preview template-${template.id} collection-theme collection-library-canvas`} data-accent={document.design.accent}><CollectionHero document={document} /><CollectionSections document={document} editing /></div></aside>;
  return <aside className={`template-library-preview template-${template.id}`} data-accent={document.design.accent} aria-live="polite">
    <header><div><span>SELECTED TEMPLATE</span><strong>{template.name}</strong></div><em>Responsive preview</em></header>
    <div className="template-preview-viewport">
      <nav><b>VF</b><span>About&nbsp;&nbsp; Skills&nbsp;&nbsp; Projects</span></nav>
      <section className="template-preview-hero"><div><small>PORTFOLIO</small><h2>{document.identity.name}</h2><h3>{document.identity.role}</h3><p>{document.identity.intro}</p><button type="button" tabIndex={-1}>Explore work</button></div><div className={`template-preview-visual scene-${document.scene.family}`} aria-hidden="true"><i /><i /><i /><b /></div></section>
      <div className="template-preview-sections"><article><span>01</span><strong>About</strong></article><article><span>02</span><strong>Selected work</strong></article><article><span>03</span><strong>Capabilities</strong></article></div>
    </div>
  </aside>;
}
