import { z } from "zod";
import {
  accentOptions,
  alignmentOptions,
  backgroundOptions,
  motionOptions,
  scenePresetOptions,
  siteDocumentSchema,
  type SiteDocument,
} from "./site-document";

export const siteCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("identity.set"), field: z.enum(["name", "role", "intro", "availability"]), value: z.string() }),
  z.object({ type: z.literal("design.setAccent"), value: z.enum(accentOptions) }),
  z.object({ type: z.literal("design.setBackground"), value: z.enum(backgroundOptions) }),
  z.object({ type: z.literal("design.setHeroAlignment"), value: z.enum(alignmentOptions) }),
  z.object({ type: z.literal("scene.setPreset"), value: z.enum(scenePresetOptions) }),
  z.object({ type: z.literal("scene.setMotion"), value: z.enum(motionOptions) }),
  z.object({ type: z.literal("scene.setIntensity"), value: z.number().min(0.4).max(1.4) }),
  z.object({ type: z.literal("scene.focusSkill"), skillId: z.string().nullable() }),
]);

export type SiteCommand = z.infer<typeof siteCommandSchema>;
export type CommandSource = "manual" | "voice";

export type CommandReceipt = {
  command: SiteCommand;
  source: CommandSource;
  summary: string;
  at: string;
};

function nextRevision(document: SiteDocument) {
  return { revision: document.revision + 1, updatedAt: new Date().toISOString() };
}

export function applySiteCommand(current: SiteDocument, candidate: unknown): SiteDocument {
  const command = siteCommandSchema.parse(candidate);
  let next: SiteDocument;

  switch (command.type) {
    case "identity.set":
      next = { ...current, identity: { ...current.identity, [command.field]: command.value }, ...nextRevision(current) };
      break;
    case "design.setAccent":
      next = { ...current, design: { ...current.design, accent: command.value }, ...nextRevision(current) };
      break;
    case "design.setBackground":
      next = { ...current, design: { ...current.design, background: command.value }, ...nextRevision(current) };
      break;
    case "design.setHeroAlignment":
      next = { ...current, design: { ...current.design, heroAlignment: command.value }, ...nextRevision(current) };
      break;
    case "scene.setPreset":
      next = { ...current, scene: { ...current.scene, preset: command.value }, ...nextRevision(current) };
      break;
    case "scene.setMotion":
      next = { ...current, scene: { ...current.scene, motion: command.value }, ...nextRevision(current) };
      break;
    case "scene.setIntensity":
      next = { ...current, scene: { ...current.scene, intensity: command.value }, ...nextRevision(current) };
      break;
    case "scene.focusSkill": {
      const exists = command.skillId === null || current.skills.some((skill) => skill.id === command.skillId);
      if (!exists) throw new Error("The requested skill does not exist in this portfolio.");
      next = { ...current, scene: { ...current.scene, focusedSkill: command.skillId }, ...nextRevision(current) };
      break;
    }
  }

  return siteDocumentSchema.parse(next);
}

export function describeCommand(command: SiteCommand, document: SiteDocument) {
  switch (command.type) {
    case "identity.set": return `Updated ${command.field}.`;
    case "design.setAccent": return `Changed the accent to ${command.value}.`;
    case "design.setBackground": return `Changed the background to ${command.value}.`;
    case "design.setHeroAlignment": return `Aligned the hero ${command.value}.`;
    case "scene.setPreset": return `Applied the ${command.value} 3D preset.`;
    case "scene.setMotion": return `Set scene motion to ${command.value}.`;
    case "scene.setIntensity": return `Set scene intensity to ${Math.round(command.value * 100)}%.`;
    case "scene.focusSkill": {
      const label = document.skills.find((skill) => skill.id === command.skillId)?.label;
      return label ? `Focused the scene on ${label}.` : "Cleared the scene focus.";
    }
  }
}
