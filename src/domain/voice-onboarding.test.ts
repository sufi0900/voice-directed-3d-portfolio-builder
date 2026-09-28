import { describe, expect, it } from "vitest";
import { beginExactCorrection, confirmExact, emptyVoiceOnboarding, isVoiceDraftReady, nextVoiceInterviewStep, proposeExact, submitExactCorrection, voiceOnboardingSchema } from "./voice-onboarding";
import { applySiteCommand } from "./commands";
import { DEFAULT_SITE_DOCUMENT } from "./site-document";
import { completeGuidedDirection } from "./guided-interview";

describe("voice-led creation approval", () => {
  it("keeps the name step locked until a corrected spelling is submitted and saved", () => {
    const proposed = proposeExact(emptyVoiceOnboarding(), "name", "Sufyan Mustafa");
    const correcting = voiceOnboardingSchema.parse(beginExactCorrection(proposed));
    expect(correcting.pending?.value).toBe("Sufyan Mustafa");
    expect(nextVoiceInterviewStep(correcting)).toMatch(/Correct Your name below/);
    expect(() => confirmExact(correcting, proposed.pending!.id)).toThrow(/Submit the corrected spelling/);
    expect(correcting.confirmed.name).toBeUndefined();
    const saved = submitExactCorrection(correcting, "Sufian Mustafa");
    expect(saved).toMatchObject({ confirmed: { name: "Sufian Mustafa" }, pending: null, correcting: null });
    expect(nextVoiceInterviewStep(saved)).toMatch(/professional role/);
    expect(() => submitExactCorrection(correcting, " ")).toThrow();
  });
  it("does not use a misheard name before a matching confirmation", () => {
    const proposed = proposeExact(emptyVoiceOnboarding(), "name", "Sufyan Mustafa");
    expect(proposed.confirmed.name).toBeUndefined();
    expect(() => confirmExact(proposed, crypto.randomUUID())).toThrow(/changed/);
    const corrected = proposeExact(proposed, "name", "Sufian Mustafa");
    expect(confirmExact(corrected, corrected.pending!.id).confirmed.name).toBe("Sufian Mustafa");
  });

  it("requires confirmed identity, skills, one purpose and a template", () => {
    let draft = emptyVoiceOnboarding();
    for (const [field, value] of [["name", "Sufian Mustafa"], ["role", "SEO Specialist"], ["intro", "I build useful SEO systems."]] as const) {
      draft = proposeExact(draft, field, value);
      expect(isVoiceDraftReady(draft)).toBe(false);
      draft = confirmExact(draft, draft.pending!.id);
    }
    expect(isVoiceDraftReady(draft)).toBe(false);
    expect(() => proposeExact(draft, "skills", "SEO strategy, computer analysis research expert")).toThrow(/Shorten/);
    draft = proposeExact(draft, "skills", "SEO strategy, Content research");
    draft = confirmExact(draft, draft.pending!.id);
    expect(nextVoiceInterviewStep(draft)).toMatch(/achieve/);
    draft.direction = { goal: "showcase-work" };
    expect(isVoiceDraftReady(draft)).toBe(false);
    draft.selectedTemplate = "cinematic-orbit";
    expect(isVoiceDraftReady(draft)).toBe(true);
    expect(nextVoiceInterviewStep(draft)).toMatch(/template are ready/);
    expect(completeGuidedDirection(draft.direction)).toMatchObject({ goal: "showcase-work", audience: "collaborators", tone: "minimal" });
  });

  it("resumes older partial design answers without repeating the goal or overwriting answered values", () => {
    const legacy = { goal: "win-clients" as const, audience: "employers" as const };
    expect(completeGuidedDirection(legacy)).toMatchObject({ goal: "win-clients", audience: "employers", motion: "balanced" });
    expect(nextVoiceInterviewStep({ ...emptyVoiceOnboarding(), confirmed: { name: "John Cena", role: "Web designer", intro: "I create websites.", skills: "Web design, UI design" }, direction: legacy })).toMatch(/template/);
  });

  it("rejects a single skill and retains the next required step on restart", () => {
    const draft = { ...emptyVoiceOnboarding(), confirmed: { name: "John Cena", role: "Web designer", intro: "I design websites." } };
    expect(nextVoiceInterviewStep(draft)).toMatch(/core skills/);
    expect(() => proposeExact(draft, "skills", "Web design")).toThrow(/2 to 8/);
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
