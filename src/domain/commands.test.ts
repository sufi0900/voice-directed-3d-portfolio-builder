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
});
