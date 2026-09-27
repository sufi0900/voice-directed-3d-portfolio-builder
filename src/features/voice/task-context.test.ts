import { afterEach, describe, expect, it, vi } from "vitest";
import { readVoiceTask, saveVoiceTask } from "./task-context";

afterEach(() => vi.unstubAllGlobals());

describe("resumable voice task context", () => {
  it("isolates saved tasks by portfolio and ignores malformed storage", () => {
    const entries = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) });
    saveVoiceTask("one", { section: "blog posts", panel: "content", itemId: "post-1", lastRequest: "Help me draft the conclusion" });
    expect(readVoiceTask("one")).toEqual({ section: "blog posts", panel: "content", itemId: "post-1", lastRequest: "Help me draft the conclusion" });
    expect(readVoiceTask("two")).toBeNull();
    entries.set("voxfolio-voice-task:one", "broken JSON");
    expect(readVoiceTask("one")).toBeNull();
  });
});
