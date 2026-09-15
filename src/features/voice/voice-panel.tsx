"use client";

import { Mic, Square } from "lucide-react";
import type { TranscriptItem, VoiceStatus } from "./use-assemblyai-agent";

type Props = { status: VoiceStatus; transcript: TranscriptItem[]; error: string | null; active: boolean; start: () => void; stop: () => void };

export function VoicePanel({ status, transcript, error, active, start, stop }: Props) {
  return (
    <section className="voice-panel" aria-label="Voice design assistant">
      <div className="voice-heading">
        <div><p className="eyebrow">VOICE ASSISTANT</p><h2>Speak to direct</h2></div>
        <span className={`status-dot ${status}`}><i />{status}</span>
      </div>
      <div className="transcript" aria-live="polite">
        {transcript.map((item) => (
          <div key={item.id} className={`message ${item.speaker}`}><span>{item.speaker === "agent" ? "Vox" : item.speaker === "user" ? "You" : "System"}</span><p>{item.text}</p></div>
        ))}
      </div>
      {error && <p className="voice-error">{error}</p>}
      <div className="voice-actions">
        <button className={active ? "voice-button stop" : "voice-button"} onClick={active ? stop : start} type="button" aria-label={active ? "End voice session" : "Start voice session"}>
          {active ? <Square size={18} fill="currentColor" /> : <Mic size={21} />}
        </button>
        <div><strong>{active ? "End session" : "Start voice"}</strong><small>Manual controls remain available</small></div>
      </div>
    </section>
  );
}
