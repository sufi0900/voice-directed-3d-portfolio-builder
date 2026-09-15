import type { SiteCommand } from "@/domain/commands";
import type { SiteDocument } from "@/domain/site-document";

export type VoiceToolResult = { ok: true; message: string } | { ok: false; error: string };

export const createVoiceTools = (document: SiteDocument) => [
  {
    type: "function",
    name: "set_color_theme",
    description: "Change the portfolio's approved accent or background theme. Use this for broad colour and mood requests.",
    parameters: {
      type: "object",
      properties: {
        accent: { type: "string", enum: ["cyan", "violet", "coral", "lime"], description: "Approved accent token." },
        background: { type: "string", enum: ["midnight", "ink", "plum", "cloud"], description: "Approved background token." },
      },
    },
  },
  {
    type: "function",
    name: "set_hero_layout",
    description: "Align the complete hero content without moving individual elements outside the layout system.",
    parameters: {
      type: "object",
      properties: { alignment: { type: "string", enum: ["left", "center", "right"] } },
      required: ["alignment"],
    },
  },
  {
    type: "function",
    name: "set_scene_style",
    description: "Change the reusable Orbital Showcase appearance or motion using approved presets.",
    parameters: {
      type: "object",
      properties: {
        preset: { type: "string", enum: ["cosmic", "architect", "minimal"] },
        motion: { type: "string", enum: ["calm", "dynamic", "still"] },
        intensity: { type: "number", minimum: 0.4, maximum: 1.4 },
      },
    },
  },
  {
    type: "function",
    name: "focus_skill",
    description: "Move visual attention to one existing skill node in the 3D scene.",
    parameters: {
      type: "object",
      properties: {
        skill_id: {
          type: "string",
          enum: document.skills.map((skill) => skill.id),
          description: document.skills.map((skill) => `${skill.id} means ${skill.label}`).join("; "),
        },
      },
      required: ["skill_id"],
    },
  },
  {
    type: "function",
    name: "update_portfolio_intro",
    description: "Replace the short hero introduction only when the user clearly dictates the new wording. Preserve factual accuracy.",
    parameters: {
      type: "object",
      properties: { text: { type: "string", minLength: 1, maxLength: 220 } },
      required: ["text"],
    },
  },
  {
    type: "function",
    name: "undo_last_change",
    description: "Undo the most recent portfolio change when the user asks to undo, revert or go back.",
    parameters: { type: "object", properties: {} },
  },
] as const;

type Execute = (command: SiteCommand) => void;

export function runVoiceTool(name: string, rawArguments: unknown, execute: Execute, undo: () => void): VoiceToolResult {
  const args = typeof rawArguments === "string" ? safeParse(rawArguments) : rawArguments;
  if (!args || typeof args !== "object") return { ok: false, error: "The tool arguments were not a valid object." };
  const values = args as Record<string, unknown>;

  try {
    switch (name) {
      case "set_color_theme": {
        let changes = 0;
        if (typeof values.accent === "string") { execute({ type: "design.setAccent", value: values.accent as never }); changes += 1; }
        if (typeof values.background === "string") { execute({ type: "design.setBackground", value: values.background as never }); changes += 1; }
        return changes ? { ok: true, message: `Applied ${changes} approved colour change${changes === 1 ? "" : "s"}.` } : { ok: false, error: "Specify an approved accent or background." };
      }
      case "set_hero_layout":
        execute({ type: "design.setHeroAlignment", value: values.alignment as never });
        return { ok: true, message: `Hero aligned ${String(values.alignment)}.` };
      case "set_scene_style": {
        let changes = 0;
        if (typeof values.preset === "string") { execute({ type: "scene.setPreset", value: values.preset as never }); changes += 1; }
        if (typeof values.motion === "string") { execute({ type: "scene.setMotion", value: values.motion as never }); changes += 1; }
        if (typeof values.intensity === "number") { execute({ type: "scene.setIntensity", value: values.intensity }); changes += 1; }
        return changes ? { ok: true, message: `Updated ${changes} scene setting${changes === 1 ? "" : "s"}.` } : { ok: false, error: "Specify a valid scene preset, motion mode or intensity." };
      }
      case "focus_skill":
        execute({ type: "scene.focusSkill", skillId: String(values.skill_id) });
        return { ok: true, message: `Focused skill ${String(values.skill_id)}.` };
      case "update_portfolio_intro":
        execute({ type: "identity.set", field: "intro", value: String(values.text ?? "") });
        return { ok: true, message: "Updated the portfolio introduction." };
      case "undo_last_change":
        undo();
        return { ok: true, message: "Undid the previous change." };
      default:
        return { ok: false, error: `Unsupported tool: ${name}.` };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "The command failed validation." };
  }
}

function safeParse(value: string): unknown {
  try { return JSON.parse(value); } catch { return null; }
}
