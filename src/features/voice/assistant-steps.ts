import type { VoiceToolResult } from "./voice-tools";

/** Stop after the first rejected action; previously applied edits remain undoable revisions. */
export async function executeAssistantSteps<T extends { name: string; arguments: unknown }>(calls: T[], run: (call: T) => Promise<VoiceToolResult>) {
  const completed: VoiceToolResult[] = [];
  for (const call of calls.slice(0, 8)) {
    const result = await run(call);
    if (!result.ok) return { completed, error: result.error };
    completed.push(result);
  }
  return { completed, error: null };
}
