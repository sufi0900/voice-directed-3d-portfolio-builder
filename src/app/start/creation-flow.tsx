"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PORTFOLIO_TEMPLATES } from "@/domain/templates";
import type { CvCandidate } from "@/domain/cv-ingestion";
import type { GuidedInterview } from "@/domain/guided-interview";
import { GuidedInterviewPanel } from "./guided-interview";

type Mode = "guided" | "template";

export function CreationFlow({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [busy, setBusy] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const [error, setError] = useState("");
  const [templateId, setTemplateId] = useState(PORTFOLIO_TEMPLATES[0].id);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [cvNotice, setCvNotice] = useState("");
  const [cvSource, setCvSource] = useState<{ sourceId: string; fileName: string; mediaType: string } | null>(null);
  const [cvCandidates, setCvCandidates] = useState<Array<CvCandidate & { approved: boolean }>>([]);
  const [interview, setInterview] = useState<Partial<GuidedInterview>>({});
  const [form, setForm] = useState({ projectName: "", name: "", role: "", intro: "" });

  async function create() {
    if (!authenticated) return router.push("/login");
    setBusy(true); setError("");
    const cv = cvSource ? {
      ...cvSource,
      importedAt: new Date().toISOString(),
      originalStored: false as const,
      approvedFacts: cvCandidates.filter((item) => item.approved).map((item) => ({ id: item.id, kind: item.kind, value: item.value, sourceExcerpt: item.sourceExcerpt })),
    } : undefined;
    const body = mode === "template" ? { mode, templateId, projectName: form.projectName } : { mode: "guided", ...form, cv, interview };
    const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setError(result.error ?? "Could not create the project.");
    router.push(`/studio/${result.projectId}`);
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
    setForm((current) => ({ ...current, name: value("name") ?? current.name, role: value("role") ?? current.role, intro: value("intro") ?? current.intro }));
  }

  if (!mode) return <section className="choice-grid">
    <button onClick={() => setMode("guided")}><span>01</span><h2>Guided creation</h2><p>Tell the system who you are and what the portfolio must achieve. We select a governed starting system.</p><b>Start guided setup →</b></button>
    <button onClick={() => setMode("template")}><span>02</span><h2>Choose a template</h2><p>Begin with a curated 3D or professional low-motion foundation, then customize it manually or by voice.</p><b>Browse templates →</b></button>
  </section>;

  return <section className="creation-card">
    <button className="text-action back-action" onClick={() => setMode(null)}>← Change creation path</button>
    <p className="eyebrow">{mode === "guided" ? "GUIDED CREATION" : "TEMPLATE LIBRARY"}</p>
    <h1>{mode === "guided" ? "Build from your goals" : "Choose a governed foundation"}</h1>
    <label>Project name<input value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} maxLength={80} placeholder="e.g. Sufian — Growth Systems Portfolio" /><small className="field-help">Use a distinct name so this portfolio is easy to find later.</small></label>
    {mode === "guided" ? <div className="guided-fields">
      <label>Your name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Professional role<input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></label>
      <label>Short positioning statement<textarea value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} maxLength={220} /></label>
      <section className={`cv-import ${cvBusy ? "is-processing" : ""}`} aria-busy={cvBusy}>
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
      </section>
      <GuidedInterviewPanel value={interview} onChange={setInterview} groundedFactCount={cvCandidates.filter((item) => item.approved).length} />
    </div> : <div className="template-grid">{PORTFOLIO_TEMPLATES.map((template) => <button type="button" className={template.id === templateId ? "selected" : ""} key={template.id} onClick={() => setTemplateId(template.id)}><i>{template.mode.toUpperCase()}</i><h3>{template.name}</h3><p>{template.description}</p><small>{template.audience}</small></button>)}</div>}
    {error && <div className="form-message">{error}</div>}
    <button className="primary-action" disabled={busy || !form.projectName || (mode === "guided" && (!form.name || !form.role || !form.intro || Object.keys(interview).length !== 5))} onClick={create}>{busy ? "Creating…" : authenticated ? "Create portfolio" : "Sign in to create"}</button>
  </section>;
}
