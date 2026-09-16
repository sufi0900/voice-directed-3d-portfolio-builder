import { z } from "zod";
import {
  accentOptions,
  alignmentOptions,
  backgroundOptions,
  motionOptions,
  portfolioSectionOptions,
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
  z.object({ type: z.literal("skill.add"), label: z.string().trim().min(1).max(32) }),
  z.object({ type: z.literal("skill.update"), skillId: z.string().min(1), label: z.string().trim().min(1).max(32).optional(), level: z.number().int().min(1).max(5).optional() }).refine((value) => value.label !== undefined || value.level !== undefined),
  z.object({ type: z.literal("skill.remove"), skillId: z.string().min(1) }),
  z.object({ type: z.literal("content.setAbout"), field: z.enum(["heading", "body"]), value: z.string() }),
  z.object({ type: z.literal("content.setContact"), field: z.enum(["heading", "email", "location", "cta"]), value: z.string() }),
  z.object({ type: z.literal("section.setVisible"), section: z.enum(portfolioSectionOptions), value: z.boolean() }),
  z.object({ type: z.literal("section.move"), section: z.enum(portfolioSectionOptions), direction: z.enum(["up", "down"]) }),
  z.object({ type: z.literal("experience.add"), role: z.string().trim().min(1).max(100).optional(), organization: z.string().trim().max(100).optional(), period: z.string().trim().max(80).optional(), summary: z.string().trim().max(500).optional() }),
  z.object({ type: z.literal("experience.update"), itemId: z.string().min(1), field: z.enum(["role", "organization", "period", "summary"]), value: z.string() }),
  z.object({ type: z.literal("experience.remove"), itemId: z.string().min(1) }),
  z.object({ type: z.literal("education.add"), credential: z.string().trim().min(1).max(140).optional(), institution: z.string().trim().max(120).optional(), period: z.string().trim().max(80).optional(), summary: z.string().trim().max(500).optional() }),
  z.object({ type: z.literal("education.update"), itemId: z.string().min(1), field: z.enum(["credential", "institution", "period", "summary"]), value: z.string() }),
  z.object({ type: z.literal("education.remove"), itemId: z.string().min(1) }),
  z.object({ type: z.literal("project.add"), title: z.string().trim().min(1).max(100).optional(), summary: z.string().trim().max(500).optional(), technologies: z.array(z.string().trim().min(1).max(32)).max(8).optional(), link: z.union([z.literal(""), z.string().url()]).optional() }),
  z.object({ type: z.literal("project.update"), itemId: z.string().min(1), field: z.enum(["title", "summary", "technologies", "link"]), value: z.union([z.string(), z.array(z.string())]) }),
  z.object({ type: z.literal("project.remove"), itemId: z.string().min(1) }),
  z.object({ type: z.literal("media.setHeadshot"), url: z.union([z.literal(""), z.string().url()]), alt: z.string().trim().max(160) }),
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
      if (command.value.trim() === current.identity[command.field]) return current;
      next = { ...current, identity: { ...current.identity, [command.field]: command.value.trim() }, ...nextRevision(current) };
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
    case "skill.add":
      if (current.skills.length >= 8) throw new Error("A portfolio can contain up to eight featured skills.");
      if (current.skills.some((skill) => skill.label.toLowerCase() === command.label.toLowerCase())) return current;
      next = { ...current, skills: [...current.skills, { id: crypto.randomUUID(), label: command.label, level: 3 }], ...nextRevision(current) };
      break;
    case "skill.update": {
      const existing = current.skills.find((skill) => skill.id === command.skillId);
      if (!existing) throw new Error("The requested skill does not exist in this portfolio.");
      const updated = { ...existing, ...(command.label !== undefined ? { label: command.label } : {}), ...(command.level !== undefined ? { level: command.level } : {}) };
      if (updated.label === existing.label && updated.level === existing.level) return current;
      next = { ...current, skills: current.skills.map((skill) => skill.id === command.skillId ? updated : skill), ...nextRevision(current) };
      break;
    }
    case "skill.remove":
      if (current.skills.length <= 3) throw new Error("Keep at least three featured skills in the portfolio.");
      if (!current.skills.some((skill) => skill.id === command.skillId)) throw new Error("The requested skill does not exist in this portfolio.");
      next = { ...current, skills: current.skills.filter((skill) => skill.id !== command.skillId), scene: { ...current.scene, focusedSkill: current.scene.focusedSkill === command.skillId ? null : current.scene.focusedSkill }, ...nextRevision(current) };
      break;
    case "content.setAbout": {
      const value = command.value.trim();
      if (value === current.content.about[command.field]) return current;
      next = { ...current, content: { ...current.content, about: { ...current.content.about, [command.field]: value } }, ...nextRevision(current) };
      break;
    }
    case "content.setContact": {
      const value = command.value.trim();
      if (value === current.content.contact[command.field]) return current;
      next = { ...current, content: { ...current.content, contact: { ...current.content.contact, [command.field]: value } }, ...nextRevision(current) };
      break;
    }
    case "section.setVisible":
      if (current.content.visibility[command.section] === command.value) return current;
      next = { ...current, content: { ...current.content, visibility: { ...current.content.visibility, [command.section]: command.value } }, ...nextRevision(current) };
      break;
    case "section.move": {
      const index = current.content.order.indexOf(command.section);
      const target = command.direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= current.content.order.length) return current;
      const order = [...current.content.order];
      [order[index], order[target]] = [order[target], order[index]];
      next = { ...current, content: { ...current.content, order }, ...nextRevision(current) };
      break;
    }
    case "experience.add":
      if (current.content.experience.length >= 8) throw new Error("A portfolio can contain up to eight experience entries.");
      next = { ...current, content: { ...current.content, experience: [...current.content.experience, { id: crypto.randomUUID(), role: command.role ?? "New role", organization: command.organization ?? "", period: command.period ?? "", summary: command.summary ?? "" }] }, ...nextRevision(current) };
      break;
    case "experience.update": {
      const item = current.content.experience.find((entry) => entry.id === command.itemId);
      if (!item) throw new Error("The requested experience entry does not exist.");
      const value = command.value.trim();
      if (item[command.field] === value) return current;
      next = { ...current, content: { ...current.content, experience: current.content.experience.map((entry) => entry.id === command.itemId ? { ...entry, [command.field]: value } : entry) }, ...nextRevision(current) };
      break;
    }
    case "experience.remove":
      if (!current.content.experience.some((entry) => entry.id === command.itemId)) throw new Error("The requested experience entry does not exist.");
      next = { ...current, content: { ...current.content, experience: current.content.experience.filter((entry) => entry.id !== command.itemId) }, ...nextRevision(current) };
      break;
    case "education.add":
      if (current.content.education.length >= 8) throw new Error("A portfolio can contain up to eight education entries.");
      next = { ...current, content: { ...current.content, education: [...current.content.education, { id: crypto.randomUUID(), credential: command.credential ?? "New credential", institution: command.institution ?? "", period: command.period ?? "", summary: command.summary ?? "" }] }, ...nextRevision(current) };
      break;
    case "education.update": {
      const item = current.content.education.find((entry) => entry.id === command.itemId);
      if (!item) throw new Error("The requested education entry does not exist.");
      const value = command.value.trim();
      if (item[command.field] === value) return current;
      next = { ...current, content: { ...current.content, education: current.content.education.map((entry) => entry.id === command.itemId ? { ...entry, [command.field]: value } : entry) }, ...nextRevision(current) };
      break;
    }
    case "education.remove":
      if (!current.content.education.some((entry) => entry.id === command.itemId)) throw new Error("The requested education entry does not exist.");
      next = { ...current, content: { ...current.content, education: current.content.education.filter((entry) => entry.id !== command.itemId) }, ...nextRevision(current) };
      break;
    case "project.add":
      if (current.content.projects.length >= 8) throw new Error("A portfolio can contain up to eight projects.");
      next = { ...current, content: { ...current.content, projects: [...current.content.projects, { id: crypto.randomUUID(), title: command.title ?? "New project", summary: command.summary ?? "", technologies: command.technologies ?? [], link: command.link ?? "" }] }, ...nextRevision(current) };
      break;
    case "project.update": {
      const item = current.content.projects.find((entry) => entry.id === command.itemId);
      if (!item) throw new Error("The requested project does not exist.");
      const value = Array.isArray(command.value) ? command.value.map((entry) => entry.trim()).filter(Boolean) : command.value.trim();
      if (JSON.stringify(item[command.field]) === JSON.stringify(value)) return current;
      next = { ...current, content: { ...current.content, projects: current.content.projects.map((entry) => entry.id === command.itemId ? { ...entry, [command.field]: value } : entry) }, ...nextRevision(current) };
      break;
    }
    case "project.remove":
      if (!current.content.projects.some((entry) => entry.id === command.itemId)) throw new Error("The requested project does not exist.");
      next = { ...current, content: { ...current.content, projects: current.content.projects.filter((entry) => entry.id !== command.itemId) }, ...nextRevision(current) };
      break;
    case "media.setHeadshot":
      if (current.media.headshotUrl === command.url && current.media.headshotAlt === command.alt) return current;
      next = { ...current, media: { headshotUrl: command.url, headshotAlt: command.alt }, ...nextRevision(current) };
      break;
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
    case "skill.add": return `Added ${command.label} to featured skills.`;
    case "skill.update": return "Updated a featured skill.";
    case "skill.remove": return "Removed a featured skill.";
    case "content.setAbout": return `Updated About ${command.field}.`;
    case "content.setContact": return `Updated Contact ${command.field}.`;
    case "section.setVisible": return `${command.value ? "Showed" : "Hid"} the ${command.section} section.`;
    case "section.move": return `Moved the ${command.section} section ${command.direction}.`;
    case "experience.add": return "Added an experience entry.";
    case "experience.update": return "Updated an experience entry.";
    case "experience.remove": return "Removed an experience entry.";
    case "education.add": return "Added an education entry.";
    case "education.update": return "Updated an education entry.";
    case "education.remove": return "Removed an education entry.";
    case "project.add": return "Added a project.";
    case "project.update": return "Updated a project.";
    case "project.remove": return "Removed a project.";
    case "media.setHeadshot": return command.url ? "Updated the portfolio headshot." : "Removed the portfolio headshot.";
  }
}
