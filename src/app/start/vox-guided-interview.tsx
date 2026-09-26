"use client";

import { useEffect, useRef, useState } from "react";
import { exactFieldSchema, exactLabels, proposeExact, confirmExact, isVoiceDraftReady, nextVoiceInterviewStep, type ExactField, type VoiceOnboarding } from "@/domain/voice-onboarding";
import { guidedInterviewSchema, GUIDED_INTERVIEW_STEPS } from "@/domain/guided-interview";
import { PORTFOLIO_TEMPLATES } from "@/domain/templates";
import { templateOptions } from "@/domain/template-contracts";
import { appendSpokenWord, isAffirmative, isDraftCreationIntent } from "@/domain/voice-conversation";

const exactFields = Object.keys(exactLabels) as ExactField[];
const creationTools = [
  { type: "function", name: "propose_exact", description: "Propose an exact value without saving it. Read back the result; ask the user if its spelling and wording are exact before confirming on a later turn.", parameters: { type: "object", properties: { field: { type: "string", enum: exactFields }, value: { type: "string" } }, required: ["field", "value"] } },
  { type: "function", name: "confirm_exact", description: "Only after the user explicitly says yes to the previous read-back, confirm the pending proposal ID. Never call in the proposal turn.", parameters: { type: "object", properties: { proposal_id: { type: "string" } }, required: ["proposal_id"] } },
  { type: "function", name: "set_direction", description: "Set one guided design preference based on the user's answer.", parameters: { type: "object", properties: { key: { type: "string", enum: GUIDED_INTERVIEW_STEPS.map(s=>s.key) }, value: { type: "string" } }, required: ["key", "value"] } },
  { type: "function", name: "choose_template", description: "Choose the actual portfolio template after explaining its audience and visual style. The visual preview will update. Confirm the user's selection; do not invent a template.", parameters: { type: "object", properties: { template_id: { type: "string", enum: templateOptions } }, required: ["template_id"] } },
  { type: "function", name: "skip_project", description: "Only when the user says they want to skip the optional first project. Continue the interview without asking for project facts.", parameters: { type: "object", properties: {} } },
  { type: "function", name: "skip_optional", description: "When the user explicitly wants to leave optional skills, education or website link blank, remove its saved content. Never remove required identity details.", parameters: { type: "object", properties: { field: { type: "string", enum: ["skills", "education", "website"] } }, required: ["field"] } },
  { type: "function", name: "create_private_draft", description: "Immediately request the real server save only when the user asks to create their private draft and all required confirmed details, design answers and template are ready. This does not publish a public site. Report the actual tool result; never claim a save before success.", parameters: { type: "object", properties: {} } },
] as const;

/** Exploratory conversation. Speech is never copied into identity, credentials or publishing fields. */
export function VoxGuidedInterview({ authenticated, value, onChange, manualSelection, onCreateDraft, onSkipOptional, saving, creationError }: { authenticated: boolean; value: VoiceOnboarding; onChange: (value: VoiceOnboarding) => void; manualSelection?: { id: number; description: string }; onCreateDraft: () => Promise<{ok:boolean;error?:string;projectId?:string}>; onSkipOptional: (field: "skills" | "education" | "website") => void; saving: boolean; creationError: string }) {
  const [lines, setLines] = useState<Array<{ who: "you" | "vox"; text: string }>>([]);
  const [live, setLive] = useState("");
  const [spoken, setSpoken] = useState("");
  const [exactField, setExactField] = useState<ExactField>("name");
  const [exactText, setExactText] = useState("");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const socket = useRef<WebSocket | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const playbackAt = useRef(0);
  const playbackNodes = useRef<AudioBufferSourceNode[]>([]);
  const sessionReady = useRef(false);
  const lastManualSelection = useRef(0);
  const pendingNotice = useRef("");
  const lastConfirmation = useRef("");
  const current = useRef(value);
  current.current = value;
  const toolResults = useRef<Array<{ call_id: string; result: string; is_error?: boolean }>>([]);
  const replyDone = useRef(false);
  const previousTurn = useRef("");
  const userTurn = useRef(0);
  const proposedOnTurn = useRef(-1);
  const savingDraft = useRef<Promise<{ok:boolean;error?:string;projectId?:string}> | null>(null);
  const interrupted = useRef(false);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }); }, [lines, live, spoken]);
  function change(next: VoiceOnboarding) { current.current = next; onChange(next); }
  function prompt(state: VoiceOnboarding) {
    return `You are Vox, a voice-directed portfolio creator. NEXT STEP FROM SAVED STATE: ${nextVoiceInterviewStep(state)}. If a template is already selected, never ask for a template again unless the user requests a change. If the user interrupts your long explanation with "yes, yes, proceed", acknowledge once and move to the next unfinished step. Keep replies under 35 words. Ask one question at a time. Exact fields require propose_exact, a spoken read-back, then explicit confirmation on a separate user turn before confirm_exact. The user may also confirm or correct using the visible buttons; when that happens the application tells you the outcome. Never retry an already-confirmed proposal or ask for a fact already confirmed. If the optional first project is declined, call skip_project and continue. Ask for name, role, introduction, then five design choices and a real template; skills, education, website and a first project are optional. When the user explicitly skips optional content, call skip_optional or skip_project. Keep each skill label short (at most 32 characters; at most eight skills) and ask for a correction if the form rejects it; never silently truncate. Present the template previews on the right and explain that the user can choose by mouse or keyboard. After choosing a template, tell them education and website link are optional on the right and they can add them now or later in Studio. If they explicitly ask to proceed, create a private draft or publish now, call create_private_draft immediately. The application also saves on clear finalization requests, so do not call this action a second time after it succeeds. It creates a PRIVATE draft, never a public site; public publishing happens in Studio later. Report its real success or specific validation failure. Never say you are waiting for a server unless you have actually invoked the tool. Never infer spelling of proper nouns or URLs. Valid design choices: ${JSON.stringify(GUIDED_INTERVIEW_STEPS.map(s=>({key:s.key,values:s.options.map(o=>o.value)})))}. Templates: ${JSON.stringify(PORTFOLIO_TEMPLATES.map(t=>({id:t.id,name:t.name,description:t.description})))}. Current confirmed facts: ${JSON.stringify(state.confirmed)}. Design answers: ${JSON.stringify(state.direction)}. Selected template: ${state.selectedTemplate ?? "none"}. First project skipped: ${!!state.projectSkipped}. Pending exact proposal: ${state.pending ? JSON.stringify({field:state.pending.field,value:state.pending.value,id:state.pending.id}) : "none"}. Respond briefly in English.`;
  }
  function notifyManual(description: string) {
    const ws = socket.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    setError("");
    ws.send(JSON.stringify({ type: "session.update", session: { system_prompt: prompt(current.current) } }));
    ws.send(JSON.stringify({ type: "conversation.message", role: "system", content: description }));
    pendingNotice.current = description;
    if (replyDone.current) announceManual();
  }
  function announceManual() {
    const ws = socket.current;
    if (!pendingNotice.current || !ws || ws.readyState !== WebSocket.OPEN) return;
    const description = pendingNotice.current; pendingNotice.current = "";
    ws.send(JSON.stringify({ type: "reply.create", instructions: `Acknowledge this completed user action and continue with the next missing interview step; do not repeat earlier questions: ${description}` }));
    replyDone.current = false;
  }
  useEffect(() => {
    if (manualSelection && manualSelection.id !== lastManualSelection.current) {
      lastManualSelection.current = manualSelection.id;
      notifyManual(manualSelection.description);
    }
  // Manual selection comes from the adjacent preview and is already reflected in value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualSelection]);
  function flushTools() {
    if (!replyDone.current || socket.current?.readyState !== WebSocket.OPEN) return;
    for (const result of toolResults.current.splice(0)) socket.current.send(JSON.stringify({ type: "tool.result", ...result }));
  }
  async function saveOnce() {
    if (savingDraft.current) return savingDraft.current;
    const task = onCreateDraft(); savingDraft.current = task;
    try { return await task; } finally { savingDraft.current = null; }
  }
  async function handleTool(item: { name?: string; call_id?: string; arguments?: unknown }) {
    let result: Record<string, unknown>;
    try {
      const args = (typeof item.arguments === "string" ? JSON.parse(item.arguments) : item.arguments ?? {}) as Record<string, unknown>;
      if (!args || typeof args !== "object") throw new Error("Invalid answer.");
      if (item.name === "propose_exact") {
        const field = exactFieldSchema.parse(args.field);
        const incoming = String(args.value ?? "").trim().replace(/\s+/g, " ");
        if (incoming && current.current.confirmed[field] === incoming) result = { confirmed: true, already_confirmed: true, next_step: "This exact value was already confirmed. Continue to the next missing field." };
        else {
          const next = proposeExact(current.current, field, incoming);
          change(next);
          proposedOnTurn.current = userTurn.current;
          result = { proposal_id: next.pending?.id, read_back: `${exactLabels[field]}: ${next.pending?.value}. Is that exactly right?`, pending: true };
        }
      } else if (item.name === "confirm_exact") {
        if (typeof args.proposal_id !== "string") throw new Error("Proposal ID required.");
        const pending = current.current.pending;
        if (!pending && args.proposal_id === lastConfirmation.current) { result = { confirmed: true, already_confirmed: true, next_step: "Continue; the user confirmed this with the button." }; }
        else if (!pending || args.proposal_id !== pending.id) { result = { confirmed: false, superseded: true, next_step: "The user corrected or replaced that proposal. Read the current pending proposal before confirming." }; }
        else {
        if (userTurn.current <= proposedOnTurn.current || !isAffirmative(previousTurn.current)) throw new Error("Wait for the user's explicit confirmation after the read-back.");
        change(confirmExact(current.current, args.proposal_id));
        lastConfirmation.current = args.proposal_id;
        previousTurn.current = "";
        result = { confirmed: true, field: pending?.field, value: pending?.value };
        }
      } else if (item.name === "set_direction") {
        const key = String(args.key) as keyof VoiceOnboarding["direction"];
        const parsed = guidedInterviewSchema.partial().safeParse({ [key]: args.value });
        if (!GUIDED_INTERVIEW_STEPS.some(step=>step.key===key) || typeof args.value !== "string" || !parsed.success) throw new Error("Choose an available design option.");
        change({ ...current.current, direction: { ...current.current.direction, ...parsed.data } });
        result = { selected: key, value: args.value };
      } else if (item.name === "choose_template") {
        const templateId = templateOptions.find(id => id === args.template_id);
        if (!templateId) throw new Error("Choose a listed portfolio template.");
        const template = PORTFOLIO_TEMPLATES.find(item => item.id === templateId)!;
        if (current.current.selectedTemplate && current.current.selectedTemplate !== templateId && !/\b(change|switch|choose|select|pick|use|prefer)\b/i.test(previousTurn.current)) {
          result = { selected: PORTFOLIO_TEMPLATES.find(t => t.id === current.current.selectedTemplate)?.name, already_selected: true, next_step: nextVoiceInterviewStep(current.current) };
        } else {
        change({ ...current.current, selectedTemplate: templateId });
        result = { selected: template.name, description: template.description, preview_updated: true, next_step: "Tell the user that education, website link, skills and first project are optional on the right. They can add them now or later; if ready, ask them to request their private draft." };
        }
      } else if (item.name === "skip_project") {
        const confirmed = { ...current.current.confirmed }; delete confirmed.projectTitle; delete confirmed.projectSummary;
        change({ ...current.current, confirmed, pending: current.current.pending?.field === "projectTitle" || current.current.pending?.field === "projectSummary" ? null : current.current.pending, projectSkipped: true });
        result = { skipped: true, next_step: "Do not ask for a first project. Continue to template selection or private draft review." };
      } else if (item.name === "skip_optional") {
        const field = args.field;
        if (field !== "skills" && field !== "education" && field !== "website") throw new Error("Only skills, education and website are optional here.");
        onSkipOptional(field);
        result = { skipped: field, next_step: "Proceed with the other confirmed details." };
      } else if (item.name === "create_private_draft") {
        if (!isVoiceDraftReady(current.current)) throw new Error("The private draft is not ready. Confirm the required name, role and introduction, all five design choices and a template first.");
        if (!userTurn.current || (!isAffirmative(previousTurn.current) && !/\b(create|save|make|build|prepare|finish|complete|publish|proceed|continue|go ahead|do it)\b/i.test(previousTurn.current)) || /\b(don't|do not|not yet|wait|hold|cancel)\b/i.test(previousTurn.current)) throw new Error("Wait for the user's spoken request to create the private draft.");
        setError("");
        result = await saveOnce();
        if (result.ok) result = { saved: true, private: true, project_id: result.projectId, next_step: "Opening Studio to review the draft. This portfolio has not been published publicly." };
        else result = { error: result.error ?? "Saving failed. Please review the highlighted field on the right." };
      } else throw new Error("Unsupported action.");
    } catch (cause) { result = { error: cause instanceof Error ? cause.message : "The answer needs review." }; }
    if ("error" in result) setError(String(result.error)); else setError("");
    if (item.call_id) toolResults.current.push({ call_id: item.call_id, result: JSON.stringify(result), is_error: "error" in result });
    flushTools();
  }
  useEffect(() => () => {
    if (captionTimer.current) clearTimeout(captionTimer.current);
    socket.current?.close();
    stream.current?.getTracks().forEach((track) => track.stop());
    playbackNodes.current.forEach(node => { try { node.stop(); } catch {} });
    if (context.current && context.current.state !== "closed") void context.current.close();
  }, []);
  function stop() {
    if (captionTimer.current) clearTimeout(captionTimer.current); captionTimer.current = null;
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type: "session.end" }));
    socket.current?.close(); socket.current = null;
    stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null;
    playbackNodes.current.forEach(node => { try { node.stop(); } catch {} }); playbackNodes.current = [];
    if (context.current && context.current.state !== "closed") void context.current.close(); context.current = null;
    playbackAt.current = 0; sessionReady.current = false; pendingNotice.current = ""; previousTurn.current = ""; userTurn.current = 0; proposedOnTurn.current = -1;
    toolResults.current = []; setActive(false); setBusy(false); setLive(""); setSpoken("");
  }
  async function start() {
    if (!authenticated) { setError("Sign in to start a voice interview."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/assemblyai/onboarding-token", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Voice is unavailable.");
      const audio = new AudioContext(); context.current = audio; playbackAt.current = 0; sessionReady.current = false;
      await audio.resume(); await audio.audioWorklet.addModule("/pcm-processor.js");
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } }); stream.current = microphone;
      const source = audio.createMediaStreamSource(microphone);
      const worklet = new AudioWorkletNode(audio, "portfolio-pcm-processor", { processorOptions: { inputSampleRate: audio.sampleRate, targetSampleRate: 24000 } });
      source.connect(worklet);
      const url = new URL("wss://agents.assemblyai.com/v1/ws"); url.searchParams.set("token", result.token);
      const ws = new WebSocket(url); socket.current = ws;
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type: "session.update", session: {
          system_prompt: prompt(current.current),
          greeting: current.current.confirmed.name ? `Welcome back, ${current.current.confirmed.name}. ${current.current.selectedTemplate ? `Your ${PORTFOLIO_TEMPLATES.find(t=>t.id===current.current.selectedTemplate)?.name ?? "portfolio"} template is already selected. ` : ""}${nextVoiceInterviewStep(current.current)}` : "Welcome to Voxfolio. I'll repeat exact details so you can check every spelling. What name should your portfolio show?",
          tools: creationTools, input: { format: { encoding: "audio/pcm" }, language_codes: ["en"], keyterms: current.current.confirmed.name ? [current.current.confirmed.name] : [], turn_detection: { min_silence: 1500, max_silence: 4500, interrupt_response: true, interruption_delay: 160 } }, output: { voice: "ivy", format: { encoding: "audio/pcm" }, volume: 100 },
        } })); setBusy(false); setActive(true);
      });
      worklet.port.onmessage = (event) => {
        if (ws.readyState !== WebSocket.OPEN || !sessionReady.current) return;
        let binary = ""; for (const byte of new Uint8Array(event.data as ArrayBuffer)) binary += String.fromCharCode(byte);
        ws.send(JSON.stringify({ type: "input.audio", audio: btoa(binary) }));
      };
      ws.addEventListener("message", (message) => {
        const item = JSON.parse(String(message.data)) as { type?: string; text?: string; delta?: string; data?: string; message?: string; name?: string; call_id?: string; arguments?: unknown; status?: string; interrupted?: boolean };
        if (item.type === "session.ready") sessionReady.current = true;
        if (item.type === "input.speech.started") { interrupted.current = true; if (captionTimer.current) clearTimeout(captionTimer.current); captionTimer.current = null; setSpoken(""); playbackNodes.current.forEach(node => { try { node.stop(); } catch {} }); playbackNodes.current = []; playbackAt.current = context.current?.currentTime ?? 0; }
        if (item.type === "transcript.user.delta" && item.text) setLive(item.text);
        if (item.type === "transcript.user" && item.text) { userTurn.current += 1; previousTurn.current = item.text; setLive(""); setLines((old) => [...old.slice(-30), { who: "you", text: item.text! }]); if (isDraftCreationIntent(item.text) && isVoiceDraftReady(current.current)) void saveOnce().then(result => { if (!result.ok) setError(result.error ?? "Could not save the draft."); }); }
        if (item.type === "transcript.agent.delta" && item.delta && !interrupted.current) setSpoken(text=>appendSpokenWord(text,item.delta!));
        if (item.type === "transcript.agent" && item.text && !interrupted.current && !item.interrupted) {
          // The final transcript can arrive before the last PCM chunk has played.
          const delay = Math.max(0, (playbackAt.current - (context.current?.currentTime ?? 0)) * 1000);
          if (captionTimer.current) clearTimeout(captionTimer.current);
          const spokenText = item.text;
          captionTimer.current = setTimeout(() => { captionTimer.current = null; if (!interrupted.current) { setSpoken(""); setLines(old => [...old.slice(-30), { who: "vox", text: spokenText }]); } }, delay);
        }
        if (item.type === "tool.call") void handleTool(item);
        if (item.type === "reply.started") { replyDone.current = false; interrupted.current = false; }
        if (item.type === "reply.done") { replyDone.current = true; const hasTools = toolResults.current.length > 0; if (item.status === "interrupted") { interrupted.current = true; if (captionTimer.current) clearTimeout(captionTimer.current); captionTimer.current = null; playbackNodes.current.forEach(node => { try { node.stop(); } catch {} }); playbackNodes.current = []; playbackAt.current = context.current?.currentTime ?? 0; setSpoken(""); toolResults.current = []; } else flushTools(); if (pendingNotice.current && !hasTools) announceManual(); }
        if (item.type === "session.error") { stop(); setError(item.message || "Voice stopped. Confirmed answers remain available in this tab."); }
        if (item.type === "reply.audio" && item.data && context.current && !interrupted.current) {
          if (context.current.state === "suspended") void context.current.resume().catch(() => setError("Audio playback was blocked. Check the browser audio permission or output device, then restart Vox."));
          const raw = atob(item.data); const view = new DataView(Uint8Array.from(raw, (ch) => ch.charCodeAt(0)).buffer);
          const buffer = context.current.createBuffer(1, Math.floor(view.byteLength / 2), 24000); const channel = buffer.getChannelData(0);
          for (let i = 0; i < channel.length; i++) channel[i] = view.getInt16(i * 2, true) / 32768;
          const player = context.current.createBufferSource(); player.buffer = buffer; player.connect(context.current.destination);
          const at = Math.max(playbackAt.current, context.current.currentTime); player.start(at); playbackAt.current = at + buffer.duration;
          playbackNodes.current.push(player); player.onended = () => { playbackNodes.current = playbackNodes.current.filter(node => node !== player); };
        }
      });
      ws.addEventListener("close", () => { stream.current?.getTracks().forEach((track) => track.stop()); setActive(false); setBusy(false); });
      ws.addEventListener("error", () => { stop(); setError("Voice connection stopped. Your confirmed answers remain available."); });
    } catch (cause) { stop(); setError(cause instanceof Error ? cause.message : "Voice unavailable. Use the accessible manual route."); }
  }
  return <section className="vox-interview" aria-label="Vox portfolio creation interview">
    <header><p className="eyebrow">BUILD WITH VOX</p><h2>Tell Vox what to build</h2><p>Vox repeats exact information before it enters your portfolio. Confirm the spelling or correct it below.</p></header>
    <div className="vox-interview-log" role="log" aria-live="polite"><p className="vox"><strong>Vox · progress</strong>{nextVoiceInterviewStep(value)}</p>{lines.map((item, index) => <p key={index} className={item.who === "you" ? "user" : "vox"}><strong>{item.who === "you" ? "You" : "Vox"}</strong>{item.text}</p>)}{live && <p className="user"><strong>You · listening</strong>{live}</p>}{spoken && <p className="vox"><strong>Vox · speaking</strong>{spoken}</p>}<div ref={bottom} /></div>
    {value.pending && <div className="voice-fact-review" role="group" aria-label="Confirm spoken information"><strong>Confirm {exactLabels[value.pending.field]}</strong><p>{value.pending.value}</p><button type="button" onClick={() => { const pending = current.current.pending; if (!pending) return; change(confirmExact(current.current, pending.id)); lastConfirmation.current = pending.id; notifyManual(`The user confirmed ${exactLabels[pending.field]} as ${pending.value} by pressing the confirmation button. This proposal is complete. Continue with the next missing question.`); }}>Yes, this is exact</button><button type="button" onClick={() => { const pending = current.current.pending; if (!pending) return; setExactField(pending.field); setExactText(pending.value); change({ ...current.current, pending: null }); notifyManual(`The user rejected the proposed ${exactLabels[pending.field]} and is correcting it in the text control. Wait for the new proposal and its separate confirmation.`); }}>Correct wording or spelling</button></div>}
    <form className="voice-exact-input" onSubmit={(event) => { event.preventDefault(); try { const next = proposeExact(current.current, exactField, exactText); change(next); proposedOnTurn.current = userTurn.current; notifyManual(`The user typed a corrected proposal for ${exactLabels[exactField]}: ${next.pending?.value}. Read this exact value back and request separate confirmation. Its proposal ID is ${next.pending?.id}.`); setExactText(""); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Review the value."); } }}><label>Correct an exact detail<select value={exactField} onChange={event=>setExactField(exactFieldSchema.parse(event.target.value))}>{exactFields.map(item=><option key={item} value={item}>{exactLabels[item]}</option>)}</select></label><input aria-label={`Propose ${exactLabels[exactField]}`} value={exactText} onChange={event=>setExactText(event.target.value)} placeholder="Type or paste exact spelling" /><button type="submit" disabled={!exactText.trim()}>Review value</button></form>
    {saving && <div className="vox-save-progress" role="status"><span className="inline-spinner" /> Saving your private portfolio draft… Vox will report the result after the server responds.</div>}
    {creationError && <p role="alert">Draft creation: {creationError}</p>}
    <div className="vox-interview-actions"><button type="button" disabled={busy} onClick={active ? stop : () => void start()}>{busy ? "Connecting…" : active ? "End voice conversation" : "Talk to Vox"}</button></div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
