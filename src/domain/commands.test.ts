import { describe, expect, it } from "vitest";
import { applySiteCommand } from "./commands";
import { DEFAULT_SITE_DOCUMENT } from "./site-document";
import { initialStudioState, studioReducer } from "@/features/studio/studio-reducer";

describe("site command bus", () => {
  it("applies a valid design command and increments the revision", () => {
    const result = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "design.setAccent", value: "violet" });
    expect(result.design.accent).toBe("violet");
    expect(result.revision).toBe(1);
  });

  it("rejects values outside the design system", () => {
    expect(() => applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "design.setAccent", value: "random-orange" })).toThrow();
  });

  it("uses the same reversible reducer path for voice commands", () => {
    const changed = studioReducer(initialStudioState, {
      type: "execute", source: "voice", command: { type: "scene.setPreset", value: "architect" },
    });
    const undone = studioReducer(changed, { type: "undo", source: "voice" });
    expect(changed.present.scene.preset).toBe("architect");
    expect(undone.present.scene.preset).toBe("cosmic");
  });

  it("refuses to focus a missing skill", () => {
    expect(() => applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "scene.focusSkill", skillId: "missing" })).toThrow();
  });

  it("does not create a revision for an unchanged buffered text commit", () => {
    const result = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "identity.set", field: "name", value: `  ${DEFAULT_SITE_DOCUMENT.identity.name}  ` });
    expect(result).toBe(DEFAULT_SITE_DOCUMENT);
    expect(result.revision).toBe(0);
  });

  it("adds, edits and removes featured skills through validated commands", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "skill.add", label: "Accessibility" });
    const skill = added.skills.find((item) => item.label === "Accessibility");
    expect(skill).toBeDefined();
    const updated = applySiteCommand(added, { type: "skill.update", skillId: skill!.id, label: "Inclusive UX", level: 5 });
    expect(updated.skills.find((item) => item.id === skill!.id)).toMatchObject({ label: "Inclusive UX", level: 5 });
    const removed = applySiteCommand(updated, { type: "skill.remove", skillId: skill!.id });
    expect(removed.skills.some((item) => item.id === skill!.id)).toBe(false);
  });
});
