"use client";

import { useEffect, useRef, useState } from "react";

/** Exploratory conversation. Speech is never copied into identity, credentials or publishing fields. */
export function VoxGuidedInterview({ authenticated }: { authenticated: boolean }) {
  const [lines, setLines] = useState<Array<{ who: "you" | "vox"; text: string }>>([]);
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState("");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const socket = useRef<WebSocket | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const playbackAt = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }); }, [lines, live]);
  useEffect(() => () => {
    socket.current?.close();
    stream.current?.getTracks().forEach((track) => track.stop());
    if (context.current && context.current.state !== "closed") void context.current.close();
  }, []);
  function stop() {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type: "session.end" }));
    socket.current?.close(); socket.current = null;
    stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null;
    if (context.current && context.current.state !== "closed") void context.current.close(); context.current = null;
    setActive(false); setBusy(false); setLive("");
  }
  async function start() {
    if (!authenticated) { setError("Sign in to use the microphone. You can complete the form below without voice."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/assemblyai/onboarding-token", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Voice is unavailable.");
      const audio = new AudioContext(); context.current = audio;
      await audio.resume(); await audio.audioWorklet.addModule("/pcm-processor.js");
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } }); stream.current = microphone;
      const source = audio.createMediaStreamSource(microphone);
      const worklet = new AudioWorkletNode(audio, "portfolio-pcm-processor", { processorOptions: { inputSampleRate: audio.sampleRate, targetSampleRate: 24000 } });
      source.connect(worklet);
      const url = new URL("wss://agents.assemblyai.com/v1/ws"); url.searchParams.set("token", result.token);
      const ws = new WebSocket(url); socket.current = ws;
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type: "session.update", session: {
          system_prompt: "You are Vox, a short, friendly portfolio brainstorming companion. Ask about the person's audience, professional goals, and work. Help them think through what to write in the editable form below. Never claim to fill any field, infer a name spelling, degree, job title or experience, or say a draft was saved. The person must enter and review their exact details manually. Answer briefly. English only.",
          greeting: "Welcome! We can talk through your portfolio goals. Please enter your exact name, professional role, education and introduction in the review form below before creating your draft. Who should your portfolio speak to?",
          tools: [], input: { format: { encoding: "audio/pcm" }, language_codes: ["en"] }, output: { voice: "ivy", format: { encoding: "audio/pcm" } },
        } })); setBusy(false); setActive(true);
      });
      worklet.port.onmessage = (event) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        let binary = ""; for (const byte of new Uint8Array(event.data as ArrayBuffer)) binary += String.fromCharCode(byte);
        ws.send(JSON.stringify({ type: "input.audio", audio: btoa(binary) }));
      };
      ws.addEventListener("message", (message) => {
        const item = JSON.parse(String(message.data)) as { type?: string; text?: string; data?: string; message?: string };
        if (item.type === "transcript.user.delta" && item.text) setLive(item.text);
        if (item.type === "transcript.user" && item.text) { setLive(""); setLines((old) => [...old, { who: "you", text: item.text! }]); }
        if (item.type === "transcript.agent" && item.text) setLines((old) => [...old, { who: "vox", text: item.text! }]);
        if (item.type === "session.error") { setError(item.message || "Voice stopped. Please enter your details below."); stop(); }
        if (item.type === "reply.audio" && item.data && context.current) {
          const raw = atob(item.data); const view = new DataView(Uint8Array.from(raw, (ch) => ch.charCodeAt(0)).buffer);
          const buffer = context.current.createBuffer(1, Math.floor(view.byteLength / 2), 24000); const channel = buffer.getChannelData(0);
          for (let i = 0; i < channel.length; i++) channel[i] = view.getInt16(i * 2, true) / 32768;
          const player = context.current.createBufferSource(); player.buffer = buffer; player.connect(context.current.destination);
          const at = Math.max(playbackAt.current, context.current.currentTime); player.start(at); playbackAt.current = at + buffer.duration;
        }
      });
      ws.addEventListener("close", () => { stream.current?.getTracks().forEach((track) => track.stop()); setActive(false); setBusy(false); });
      ws.addEventListener("error", () => { setError("Voice connection stopped. Your form entries are safe."); stop(); });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Voice unavailable. Please use the form below."); stop(); }
  }
  return <section className="vox-interview" aria-label="Optional Vox conversation">
    <header><p className="eyebrow">OPTIONAL VOICE BRAINSTORMING</p><h2>Talk through your direction</h2><p>Explore your goals with Vox. Enter and check your exact profile details in the form below. Speech will never fill those fields automatically.</p></header>
    <div className="vox-interview-log" role="log" aria-live="polite"><p className="vox"><strong>Vox</strong>Who is this portfolio for, and what would you like it to accomplish?</p>{lines.map((item, index) => <p key={index} className={item.who === "you" ? "user" : "vox"}><strong>{item.who === "you" ? "You" : "Vox"}</strong>{item.text}</p>)}{live && <p className="user"><strong>You · listening</strong>{live}</p>}<div ref={bottom} /></div>
    <form onSubmit={(event) => { event.preventDefault(); if (draft.trim()) { setLines((old) => [...old, { who: "you", text: draft.trim() }]); setDraft(""); } }}><input aria-label="Conversation note" value={draft} maxLength={600} placeholder="Keep a note from this conversation (not saved to your portfolio)" onChange={(event) => setDraft(event.target.value)} /><button type="submit" disabled={!draft.trim()}>Add note</button></form>
    <div className="vox-interview-actions"><button type="button" disabled={busy} onClick={active ? stop : () => void start()}>{busy ? "Connecting…" : active ? "End voice conversation" : "Talk to Vox"}</button></div>
    {error && <p role="alert">{error}</p>}
  </section>;
}
