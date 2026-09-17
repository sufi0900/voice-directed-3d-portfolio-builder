"use client";

import { Mic, PanelRightClose, Square } from "lucide-react";
import type { TranscriptItem, VoiceStatus } from "./use-assemblyai-agent";

type Props = { status: VoiceStatus; transcript: TranscriptItem[]; error: string | null; active: boolean; start: () => void; stop: () => void; onHide?: () => void };

export function VoicePanel({ status, transcript, error, active, start, stop, onHide }: Props) {
  return (
    <section className="voice-panel" aria-label="Voice design assistant">
      <div className="voice-heading">
        <div><p className="eyebrow">VOICE ASSISTANT</p><h2>Speak to direct</h2></div>
        <div className="voice-heading-actions"><span className={`status-dot ${status}`}><i />{status}</span>{onHide && <button type="button" onClick={onHide} title="Hide voice assistant" aria-label="Hide voice assistant"><PanelRightClose size={15} /></button>}</div>
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
        <div><strong>{active ? "End session" : "Start voice"}</strong><small>Voice can draft text and articles. Upload images manually.</small></div>
      </div>
    </section>
  );
}
