"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteCommand } from "@/domain/commands";
import type { SiteDocument } from "@/domain/site-document";
import { createVoiceTools, runVoiceTool } from "./voice-tools";

export type TranscriptItem = { id: string; speaker: "user" | "agent" | "system"; text: string; final: boolean };
export type VoiceStatus = "idle" | "connecting" | "listening" | "speaking" | "error";

type VoiceOptions = {
  document: SiteDocument;
  execute: (command: SiteCommand) => void;
  undo: () => void;
};

type AgentEvent = Record<string, unknown> & { type?: string; text?: string; status?: string; call_id?: string; name?: string; arguments?: unknown; data?: string; message?: string; session_id?: string };
type PendingTool = { callId: string; result: unknown };

const SYSTEM_PROMPT = `You are Vox, a concise portfolio design assistant inside a visual editor. Manual controls remain available for precise edits. Use function tools whenever the user requests a visible change. Never claim a change happened unless the tool result confirms it. Stay within the approved presets and existing portfolio facts. Do not invent experience, skills or qualifications. If a request is ambiguous, ask one short clarification. You cannot publish, delete a project, upload files or execute code. Keep spoken replies under two sentences and mention the visible result after a successful tool call.`;

export function useAssemblyAIAgent({ document, execute, undo }: VoiceOptions) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([
    { id: "welcome", speaker: "system", text: "Voice is optional. Start a session, then try “switch to violet” or “focus on AI automation.”", final: true },
  ]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const playbackRef = useRef<AudioBufferSourceNode[]>([]);
  const playbackTimeRef = useRef(0);
  const lastEventRef = useRef<string | null>(null);
  const pendingToolsRef = useRef<PendingTool[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const executeRef = useRef(execute);
  const undoRef = useRef(undo);
  const documentRef = useRef(document);

  useEffect(() => { executeRef.current = execute; }, [execute]);
  useEffect(() => { undoRef.current = undo; }, [undo]);
  useEffect(() => { documentRef.current = document; }, [document]);

  const appendTranscript = useCallback((speaker: TranscriptItem["speaker"], text: string, final = true) => {
    if (!text.trim()) return;
    setTranscript((items) => [...items.slice(-29), { id: `${Date.now()}-${Math.random()}`, speaker, text, final }]);
  }, []);

  const cleanup = useCallback(async () => {
    playbackRef.current.forEach((node) => { try { node.stop(); } catch {} });
    playbackRef.current = [];
    workletRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    wsRef.current?.close();
    wsRef.current = null;
    streamRef.current = null;
    sourceRef.current = null;
    workletRef.current = null;
    pendingToolsRef.current = [];
    sessionIdRef.current = null;
    if (contextRef.current && contextRef.current.state !== "closed") await contextRef.current.close();
    contextRef.current = null;
    setStatus("idle");
  }, []);

  const flushTools = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || lastEventRef.current !== "reply.done") return;
    for (const tool of pendingToolsRef.current) {
      ws.send(JSON.stringify({ type: "tool.result", call_id: tool.callId, result: JSON.stringify(tool.result) }));
    }
    pendingToolsRef.current = [];
  }, []);

  const playAudio = useCallback((encoded: string) => {
    const context = contextRef.current;
    if (!context) return;
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const sampleCount = Math.floor(bytes.length / 2);
    const pcm = new Int16Array(sampleCount);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < sampleCount; i += 1) pcm[i] = view.getInt16(i * 2, true);
    const buffer = context.createBuffer(1, pcm.length, 24000);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i += 1) channel[i] = pcm[i] / 32768;
    const node = context.createBufferSource();
    node.buffer = buffer;
    node.connect(context.destination);
    const startAt = Math.max(playbackTimeRef.current, context.currentTime);
    node.start(startAt);
    playbackTimeRef.current = startAt + buffer.duration;
    playbackRef.current.push(node);
    node.onended = () => { playbackRef.current = playbackRef.current.filter((item) => item !== node); };
  }, []);

  const handleEvent = useCallback((event: AgentEvent) => {
    const type = event.type ?? "";
    if (type === "session.ready") {
      lastEventRef.current = type;
      sessionIdRef.current = typeof event.session_id === "string" ? event.session_id : null;
      setStatus("listening");
    }
    if (type === "input.speech.started") { lastEventRef.current = type; setStatus("listening"); }
    if (type === "reply.started") { lastEventRef.current = type; setStatus("speaking"); }
    if (type === "reply.audio" && typeof event.data === "string") playAudio(event.data);
    if (type === "transcript.user" && typeof event.text === "string") appendTranscript("user", event.text);
    if (type === "transcript.agent" && typeof event.text === "string") appendTranscript("agent", event.text);
    if (type === "tool.call" && event.call_id && event.name) {
      const result = runVoiceTool(event.name, event.arguments, executeRef.current, undoRef.current);
      pendingToolsRef.current.push({ callId: event.call_id, result });
      flushTools();
    }
    if (type === "reply.done") {
      lastEventRef.current = type;
      if (event.status === "interrupted") {
        pendingToolsRef.current = [];
        playbackRef.current.forEach((node) => { try { node.stop(); } catch {} });
        playbackRef.current = [];
        if (contextRef.current) playbackTimeRef.current = contextRef.current.currentTime;
      } else flushTools();
      setStatus("listening");
    }
    if (type === "session.ended") {
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        void fetch(`/api/assemblyai/session/${encodeURIComponent(sessionId)}`, { method: "DELETE" })
          .then((response) => { if (!response.ok) appendTranscript("system", "The voice session ended, but automatic provider-session deletion could not be confirmed."); })
          .finally(() => { void cleanup(); });
      } else void cleanup();
    }
    if (type === "session.error" || type === "error") {
      const message = event.message || "The voice session encountered an error.";
      setError(message);
      appendTranscript("system", message);
      setStatus("error");
    }
  }, [appendTranscript, cleanup, flushTools, playAudio]);

  const start = useCallback(async () => {
    if (status !== "idle" && status !== "error") return;
    setError(null);
    setStatus("connecting");
    try {
      const tokenResponse = await fetch("/api/assemblyai/token", { cache: "no-store" });
      const tokenPayload = (await tokenResponse.json()) as { token?: string; error?: string };
      if (!tokenResponse.ok || !tokenPayload.token) throw new Error(tokenPayload.error || "Could not create a voice session.");

      const context = new AudioContext();
      contextRef.current = context;
      await context.resume();
      await context.audioWorklet.addModule("/pcm-processor.js");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } });
      streamRef.current = stream;
      const source = context.createMediaStreamSource(stream);
      sourceRef.current = source;
      const worklet = new AudioWorkletNode(context, "portfolio-pcm-processor", {
        processorOptions: { inputSampleRate: context.sampleRate, targetSampleRate: 24000 },
      });
      workletRef.current = worklet;
      source.connect(worklet);

      const wsUrl = new URL("wss://agents.assemblyai.com/v1/ws");
      wsUrl.searchParams.set("token", tokenPayload.token);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      worklet.port.onmessage = (message) => {
        if (ws.readyState !== WebSocket.OPEN || lastEventRef.current === null) return;
        const bytes = new Uint8Array(message.data as ArrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
        ws.send(JSON.stringify({ type: "input.audio", audio: btoa(binary) }));
      };

      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            system_prompt: SYSTEM_PROMPT,
            greeting: "I’m ready. Tell me what broad change you want to make, or use the manual controls for precision.",
            output: { voice: "alba", format: { encoding: "audio/pcm" }, volume: 100 },
            input: {
              format: { encoding: "audio/pcm" },
              language_codes: ["en"],
              transcription_mode: "balanced",
              transcription_prompt: "Expect portfolio design terms, Next.js, Three.js, technical SEO and AI automation.",
              voice_focus: "near-field",
              voice_focus_threshold: 0.8,
              turn_detection: { min_silence: 700, max_silence: 2200, interrupt_response: true, interruption_delay: 180 },
            },
            tools: createVoiceTools(documentRef.current),
          },
        }));
      });
      ws.addEventListener("message", (message) => handleEvent(JSON.parse(String(message.data)) as AgentEvent));
      ws.addEventListener("close", () => { if (wsRef.current === ws) void cleanup(); });
      ws.addEventListener("error", () => { setError("The voice connection could not be established."); setStatus("error"); });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not start the voice session.";
      setError(message);
      appendTranscript("system", message);
      setStatus("error");
      await cleanup();
      setStatus("error");
    }
  }, [appendTranscript, cleanup, handleEvent, status]);

  const stop = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "session.end" }));
      window.setTimeout(() => { if (wsRef.current === ws) void cleanup(); }, 800);
    } else void cleanup();
  }, [cleanup]);

  useEffect(() => {
    const onPageHide = () => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "session.end" }));
    };
    window.addEventListener("pagehide", onPageHide);
    return () => { window.removeEventListener("pagehide", onPageHide); void cleanup(); };
  }, [cleanup]);

  return { status, transcript, error, start, stop, active: status !== "idle" && status !== "error" };
}
