import { describe, expect, it } from "vitest";
import { confirmExact, emptyVoiceOnboarding, isVoiceDraftReady, nextVoiceInterviewStep, proposeExact } from "./voice-onboarding";
import { applySiteCommand } from "./commands";
import { DEFAULT_SITE_DOCUMENT } from "./site-document";

describe("voice-led creation approval", () => {
  it("does not use a misheard name before a matching confirmation", () => {
    const proposed = proposeExact(emptyVoiceOnboarding(), "name", "Sufyan Mustafa");
    expect(proposed.confirmed.name).toBeUndefined();
    expect(() => confirmExact(proposed, crypto.randomUUID())).toThrow(/changed/);
    const corrected = proposeExact(proposed, "name", "Sufian Mustafa");
    expect(confirmExact(corrected, corrected.pending!.id).confirmed.name).toBe("Sufian Mustafa");
  });

  it("requires confirmed identity, introduction and all design choices", () => {
    let draft = emptyVoiceOnboarding();
    for (const [field, value] of [["name", "Sufian Mustafa"], ["role", "SEO Specialist"], ["intro", "I build useful SEO systems."]] as const) {
      draft = proposeExact(draft, field, value);
      expect(isVoiceDraftReady(draft)).toBe(false);
      draft = confirmExact(draft, draft.pending!.id);
    }
    expect(isVoiceDraftReady(draft)).toBe(false);
    draft.direction = { goal: "showcase-work", audience: "clients", tone: "bold", motion: "balanced", emphasis: "results" };
    expect(isVoiceDraftReady(draft)).toBe(false);
    draft.selectedTemplate = "cinematic-orbit";
    expect(isVoiceDraftReady(draft)).toBe(true);
    expect(nextVoiceInterviewStep(draft)).toMatch(/already selected/);
  });

  it("rejects unsupported website URLs instead of accepting an ambiguous spoken link", () => {
    expect(() => proposeExact(emptyVoiceOnboarding(), "website", "example dot com")).toThrow(/https/);
  });

  it("creates a substantial unpublished article in one governed edit", () => {
    const next = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "post", title: "Technical SEO notes", body: "A user-approved first paragraph.", excerpt: "What I learned from a real SEO review.", seoTitle: "Technical SEO notes", seoDescription: "Practical observations from a review." });
    expect(next.publishing.posts[0]).toMatchObject({ title: "Technical SEO notes", status: "draft", excerpt: "What I learned from a real SEO review.", blocks: [{ type: "paragraph", text: "A user-approved first paragraph." }] });
    expect(DEFAULT_SITE_DOCUMENT.publishing.posts).toHaveLength(0);
  });
});
