import type { SiteCommand } from "@/domain/commands";
import type { SiteDocument } from "@/domain/site-document";

export type VoiceToolResult = { ok: true; message: string } | { ok: false; error: string };
type Execute = (command: SiteCommand) => void;
type PolishTarget = "hero_intro" | "about_body" | "experience_summary" | "education_summary" | "project_summary";
type Polish = (text: string, target: PolishTarget) => Promise<string>;
const action = { type: "string", enum: ["add", "update", "remove"] } as const;
const idParameter = (items: Array<{ id: string; label: string }>) => items.length
  ? { type: "string", enum: items.map((item) => item.id), description: items.map((item) => `${item.id}: ${item.label}`).join("; ") }
  : { type: "string", description: "No existing entries are available; use the add action." };

export const createVoiceTools = (document: SiteDocument) => [
  { type: "function", name: "update_text_content", description: "Edit Hero, About, or Contact text. For raw narrative copy, set polish=true to refine it without inventing facts.", parameters: { type: "object", properties: { target: { type: "string", enum: ["hero_name", "hero_role", "hero_intro", "hero_availability", "about_heading", "about_body", "contact_heading", "contact_email", "contact_location", "contact_cta"] }, text: { type: "string" }, polish: { type: "boolean" } }, required: ["target", "text"] } },
  { type: "function", name: "manage_skill", description: "Add, rename, level, or remove a featured skill.", parameters: { type: "object", properties: { action, skill_id: { type: "string", enum: document.skills.map((item) => item.id), description: document.skills.map((item) => `${item.id}: ${item.label}`).join("; ") }, label: { type: "string", maxLength: 32 }, level: { type: "number", minimum: 1, maximum: 5 } }, required: ["action"] } },
  { type: "function", name: "manage_experience", description: "Add, update, or remove experience using only facts stated by the user.", parameters: { type: "object", properties: { action, item_id: idParameter(document.content.experience.map((item) => ({ id: item.id, label: item.role }))), role: { type: "string" }, organization: { type: "string" }, period: { type: "string" }, summary: { type: "string" }, polish_summary: { type: "boolean" } }, required: ["action"] } },
  { type: "function", name: "manage_education", description: "Add, update, or remove education using only facts stated by the user.", parameters: { type: "object", properties: { action, item_id: idParameter(document.content.education.map((item) => ({ id: item.id, label: item.credential }))), credential: { type: "string" }, institution: { type: "string" }, period: { type: "string" }, summary: { type: "string" }, polish_summary: { type: "boolean" } }, required: ["action"] } },
  { type: "function", name: "manage_project", description: "Add, update, or remove selected projects. Never invent outcomes or technologies.", parameters: { type: "object", properties: { action, item_id: idParameter(document.content.projects.map((item) => ({ id: item.id, label: item.title }))), title: { type: "string" }, summary: { type: "string" }, technologies: { type: "array", items: { type: "string" }, maxItems: 8 }, link: { type: "string" }, polish_summary: { type: "boolean" } }, required: ["action"] } },
  { type: "function", name: "set_section", description: "Show, hide, or move a portfolio section.", parameters: { type: "object", properties: { section: { type: "string", enum: ["about", "experience", "skills", "projects", "contact"] }, visible: { type: "boolean" }, direction: { type: "string", enum: ["up", "down"] } }, required: ["section"] } },
  { type: "function", name: "set_color_theme", description: "Change the approved accent or background theme.", parameters: { type: "object", properties: { accent: { type: "string", enum: ["cyan", "violet", "coral", "lime"] }, background: { type: "string", enum: ["midnight", "ink", "plum", "cloud"] } } } },
  { type: "function", name: "set_hero_layout", description: "Align the complete Hero content.", parameters: { type: "object", properties: { alignment: { type: "string", enum: ["left", "center", "right"] } }, required: ["alignment"] } },
  { type: "function", name: "set_scene_style", description: "Change the Orbital Showcase appearance or motion.", parameters: { type: "object", properties: { preset: { type: "string", enum: ["cosmic", "architect", "minimal"] }, motion: { type: "string", enum: ["calm", "dynamic", "still"] }, intensity: { type: "number", minimum: 0.4, maximum: 1.4 } } } },
  { type: "function", name: "focus_skill", description: "Focus the 3D scene on an existing skill.", parameters: { type: "object", properties: { skill_id: { type: "string", enum: document.skills.map((item) => item.id) } }, required: ["skill_id"] } },
  { type: "function", name: "undo_last_change", description: "Undo the most recent portfolio change.", parameters: { type: "object", properties: {} } },
] as const;

export async function runVoiceTool(name: string, rawArguments: unknown, execute: Execute, undo: () => void, polish?: Polish): Promise<VoiceToolResult> {
  const args = typeof rawArguments === "string" ? safeParse(rawArguments) : rawArguments;
  if (!args || typeof args !== "object") return { ok: false, error: "The tool arguments were not a valid object." };
  const values = args as Record<string, unknown>;
  const string = (key: string) => typeof values[key] === "string" ? String(values[key]).trim() : "";
  try {
    switch (name) {
      case "update_text_content": {
        const target = string("target"), raw = string("text");
        if (!raw) return { ok: false, error: "Provide the text to apply." };
        const polishTarget = target === "hero_intro" || target === "about_body" ? target : null;
        const text = values.polish === true && polishTarget && polish ? await polish(raw, polishTarget) : raw;
        const command = textCommand(target, text);
        if (!command) return { ok: false, error: "That text target is not supported." };
        execute(command); return { ok: true, message: values.polish === true && polishTarget ? "Refined and updated the requested text." : "Updated the requested text." };
      }
      case "manage_skill": {
        const mode = string("action");
        if (mode === "add") execute({ type: "skill.add", label: string("label") });
        else if (mode === "update") execute({ type: "skill.update", skillId: string("skill_id"), ...(string("label") ? { label: string("label") } : {}), ...(typeof values.level === "number" ? { level: values.level } : {}) });
        else if (mode === "remove") execute({ type: "skill.remove", skillId: string("skill_id") });
        else return { ok: false, error: "Choose add, update, or remove." };
        return { ok: true, message: `Skill ${mode} completed.` };
      }
      case "manage_experience": return manageExperience(values, string, execute, polish);
      case "manage_education": return manageEducation(values, string, execute, polish);
      case "manage_project": return manageProject(values, string, execute, polish);
      case "set_section": {
        const section = string("section") as "about" | "experience" | "skills" | "projects" | "contact";
        if (typeof values.visible === "boolean") execute({ type: "section.setVisible", section, value: values.visible });
        if (values.direction === "up" || values.direction === "down") execute({ type: "section.move", section, direction: values.direction });
        if (typeof values.visible !== "boolean" && !values.direction) return { ok: false, error: "Specify visibility or movement." };
        return { ok: true, message: `Updated the ${section} section.` };
      }
      case "set_color_theme": {
        let changes = 0;
        if (string("accent")) { execute({ type: "design.setAccent", value: string("accent") as never }); changes += 1; }
        if (string("background")) { execute({ type: "design.setBackground", value: string("background") as never }); changes += 1; }
        return changes ? { ok: true, message: `Applied ${changes} approved colour change${changes === 1 ? "" : "s"}.` } : { ok: false, error: "Specify an approved colour setting." };
      }
      case "set_hero_layout": execute({ type: "design.setHeroAlignment", value: string("alignment") as never }); return { ok: true, message: "Updated the Hero alignment." };
      case "set_scene_style": {
        let changes = 0;
        if (string("preset")) { execute({ type: "scene.setPreset", value: string("preset") as never }); changes += 1; }
        if (string("motion")) { execute({ type: "scene.setMotion", value: string("motion") as never }); changes += 1; }
        if (typeof values.intensity === "number") { execute({ type: "scene.setIntensity", value: values.intensity }); changes += 1; }
        return changes ? { ok: true, message: "Updated the 3D scene." } : { ok: false, error: "Specify a scene setting." };
      }
      case "focus_skill": execute({ type: "scene.focusSkill", skillId: string("skill_id") }); return { ok: true, message: "Focused the requested skill." };
      case "undo_last_change": undo(); return { ok: true, message: "Undid the previous change." };
      default: return { ok: false, error: `Unsupported tool: ${name}.` };
    }
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "The command failed validation." }; }
}

function textCommand(target: string, value: string): SiteCommand | null {
  const identity = { hero_name: "name", hero_role: "role", hero_intro: "intro", hero_availability: "availability" } as const;
  if (target in identity) return { type: "identity.set", field: identity[target as keyof typeof identity], value };
  if (target === "about_heading" || target === "about_body") return { type: "content.setAbout", field: target === "about_heading" ? "heading" : "body", value };
  const contact = { contact_heading: "heading", contact_email: "email", contact_location: "location", contact_cta: "cta" } as const;
  if (target in contact) return { type: "content.setContact", field: contact[target as keyof typeof contact], value };
  return null;
}

async function manageExperience(values: Record<string, unknown>, string: (key: string) => string, execute: Execute, polish?: Polish): Promise<VoiceToolResult> {
  const mode = string("action"), id = string("item_id");
  if (mode === "add") execute({ type: "experience.add", role: string("role") || undefined, organization: string("organization"), period: string("period"), summary: await maybePolish(values, string("summary"), "experience_summary", polish) });
  else if (mode === "remove") execute({ type: "experience.remove", itemId: id });
  else if (mode === "update") for (const field of ["role", "organization", "period", "summary"] as const) if (typeof values[field] === "string") execute({ type: "experience.update", itemId: id, field, value: field === "summary" ? await maybePolish(values, string(field), "experience_summary", polish) : string(field) });
  else return { ok: false, error: "Choose add, update, or remove." };
  return { ok: true, message: `Experience ${mode} completed.` };
}

async function manageEducation(values: Record<string, unknown>, string: (key: string) => string, execute: Execute, polish?: Polish): Promise<VoiceToolResult> {
  const mode = string("action"), id = string("item_id");
  if (mode === "add") execute({ type: "education.add", credential: string("credential") || undefined, institution: string("institution"), period: string("period"), summary: await maybePolish(values, string("summary"), "education_summary", polish) });
  else if (mode === "remove") execute({ type: "education.remove", itemId: id });
  else if (mode === "update") for (const field of ["credential", "institution", "period", "summary"] as const) if (typeof values[field] === "string") execute({ type: "education.update", itemId: id, field, value: field === "summary" ? await maybePolish(values, string(field), "education_summary", polish) : string(field) });
  else return { ok: false, error: "Choose add, update, or remove." };
  return { ok: true, message: `Education ${mode} completed.` };
}

async function manageProject(values: Record<string, unknown>, string: (key: string) => string, execute: Execute, polish?: Polish): Promise<VoiceToolResult> {
  const mode = string("action"), id = string("item_id");
  const technologies = Array.isArray(values.technologies) ? values.technologies.map(String) : undefined;
  const summary = await maybePolish(values, string("summary"), "project_summary", polish);
  if (mode === "add") execute({ type: "project.add", title: string("title") || undefined, summary, technologies, link: string("link") });
  else if (mode === "remove") execute({ type: "project.remove", itemId: id });
  else if (mode === "update") {
    if (typeof values.title === "string") execute({ type: "project.update", itemId: id, field: "title", value: string("title") });
    if (typeof values.summary === "string") execute({ type: "project.update", itemId: id, field: "summary", value: summary });
    if (technologies) execute({ type: "project.update", itemId: id, field: "technologies", value: technologies });
    if (typeof values.link === "string") execute({ type: "project.update", itemId: id, field: "link", value: string("link") });
  } else return { ok: false, error: "Choose add, update, or remove." };
  return { ok: true, message: `Project ${mode} completed.` };
}

async function maybePolish(values: Record<string, unknown>, text: string, target: PolishTarget, polish?: Polish) { return values.polish_summary === true && text && polish ? polish(text, target) : text; }
function safeParse(value: string): unknown { try { return JSON.parse(value); } catch { return null; } }
