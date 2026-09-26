import { describe, expect, it } from "vitest";
import { describeCreationIssue, guidedCreateSchema, selectedFirstProject } from "./project-creation";
import { emptyVoiceOnboarding } from "./voice-onboarding";

const base = {
  mode: "guided", templateId: "cinematic-orbit", projectName: "Sufian Portfolio",
  name: "Sufian Mustafa", role: "SEO content writer", intro: "I write useful, grounded content.",
  skills: ["SEO strategy"], education: [], website: "",
  interview: { goal: "showcase-work", audience: "clients", tone: "bold", motion: "balanced", emphasis: "results" },
};

describe("project creation validation", () => {
  it("never includes a previously approved first project after the user skips it", () => {
    const previous = { ...emptyVoiceOnboarding(), confirmed: { projectTitle: "Old project", projectSummary: "Details" }, projectSkipped: true };
    expect(selectedFirstProject(previous)).toBeUndefined();
    expect(guidedCreateSchema.safeParse({ ...base, firstProject: selectedFirstProject(previous) }).success).toBe(true);
  });
  it("identifies the actual invalid skill rather than blaming the first project", () => {
    const parsed = guidedCreateSchema.safeParse({ ...base, skills: ["computer analysis research expert"] });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(describeCreationIssue(parsed.error.issues[0])).toMatch(/Core skills \(item 1\)/);
  });
});
