import { describe, expect, it } from "vitest";
import { applySiteCommand } from "./commands";
import { DEFAULT_SITE_DOCUMENT, validateSiteDocument } from "./site-document";
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

  it("upgrades legacy hero documents with the V9 section model", () => {
    const legacy = structuredClone(DEFAULT_SITE_DOCUMENT) as unknown as Record<string, unknown>;
    delete legacy.content;
    delete legacy.media;
    const upgraded = validateSiteDocument(legacy);
    expect(upgraded.content.order).toEqual(["about", "experience", "skills", "projects", "contact"]);
    expect(upgraded.content.visibility.projects).toBe(true);
    expect(upgraded.content.education).toEqual([]);
    expect(upgraded.media).toEqual({ headshotUrl: "", headshotAlt: "" });
  });

  it("edits and reorders full portfolio sections through validated commands", () => {
    const edited = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "content.setAbout", field: "body", value: "A focused professional overview." });
    const moved = applySiteCommand(edited, { type: "section.move", section: "projects", direction: "up" });
    const hidden = applySiteCommand(moved, { type: "section.setVisible", section: "experience", value: false });
    expect(edited.content.about.body).toBe("A focused professional overview.");
    expect(moved.content.order.indexOf("projects")).toBeLessThan(moved.content.order.indexOf("skills"));
    expect(hidden.content.visibility.experience).toBe(false);
  });

  it("adds, edits and removes experience and project records", () => {
    const withExperience = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "experience.add" });
    const experience = withExperience.content.experience.at(-1)!;
    const editedExperience = applySiteCommand(withExperience, { type: "experience.update", itemId: experience.id, field: "role", value: "Product Engineer" });
    expect(editedExperience.content.experience.at(-1)?.role).toBe("Product Engineer");
    const withProject = applySiteCommand(editedExperience, { type: "project.add" });
    const project = withProject.content.projects.at(-1)!;
    const editedProject = applySiteCommand(withProject, { type: "project.update", itemId: project.id, field: "technologies", value: ["Next.js", "Supabase"] });
    expect(editedProject.content.projects.at(-1)?.technologies).toEqual(["Next.js", "Supabase"]);
    const removed = applySiteCommand(editedProject, { type: "project.remove", itemId: project.id });
    expect(removed.content.projects.some((item) => item.id === project.id)).toBe(false);
  });

  it("adds education and updates governed profile media", () => {
    const educated = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "education.add", credential: "MCS", institution: "AWKUM", period: "Completed" });
    const withImage = applySiteCommand(educated, { type: "media.setHeadshot", url: "https://example.com/headshot.webp", alt: "Sufian Mustafa headshot" });
    expect(educated.content.education.at(-1)).toMatchObject({ credential: "MCS", institution: "AWKUM" });
    expect(withImage.media.headshotUrl).toBe("https://example.com/headshot.webp");
  });
});
