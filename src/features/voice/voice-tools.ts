import type { SiteCommand } from "@/domain/commands";
import type { SiteDocument } from "@/domain/site-document";

export type AssistantNavigation = {
  section: string;
  itemId?: string;
  panel?: "content" | "design" | "scene";
};
export type VoiceToolResult = { ok: true; message: string; navigation?: AssistantNavigation } | { ok: false; error: string };
type Execute = (command: SiteCommand) => void;
type PolishTarget = "hero_intro" | "about_body" | "experience_summary" | "education_summary" | "project_summary";
type Polish = (text: string, target: PolishTarget) => Promise<string>;
const action = { type: "string", enum: ["add", "update", "remove"] } as const;
const idParameter = (items: Array<{ id: string; label: string }>) => items.length
  ? { type: "string", enum: items.map((item) => item.id), description: items.map((item) => `${item.id}: ${item.label}`).join("; ") }
  : { type: "string", description: "No existing entries are available; use the add action." };

export const createVoiceTools = (document: SiteDocument) => [
  { type: "function", name: "navigate_to", description: "Navigate the Studio editor and Live Canvas to the requested portfolio area without changing content. Use this whenever the user says go, show, open, navigate, or jump.", parameters: { type: "object", properties: { destination: { type: "string", enum: ["hero", "about", "experience", "education", "skills", "projects", "contact", "opportunity", "site_pages", "blog", "page_structure", "media_library", "design", "scene"] }, item_id: { type: "string", description: "Optional existing page or blog-post ID to open." } }, required: ["destination"] } },
  { type: "function", name: "manage_opportunity_variant", description: "Edit the brief, audience, status, visibility, approved project selection, or owner-review notes of the current opportunity variant. Never use this to change the canonical portfolio. Creating a new variant happens from My projects.", parameters: { type: "object", properties: { title: { type: "string", maxLength: 120 }, brief: { type: "string", maxLength: 2400 }, audience: { type: "string", maxLength: 160 }, approval_notes: { type: "string", maxLength: 1200 }, status: { type: "string", enum: ["draft", "review", "published", "archived"] }, visibility: { type: "string", enum: ["private", "shared", "public"] }, included_project_ids: { type: "array", items: { type: "string", enum: document.content.projects.map((project) => project.id) }, maxItems: 8 } } } },
  { type: "function", name: "update_text_content", description: "Edit Hero, About, or Contact text. For raw narrative copy, set polish=true to refine it without inventing facts.", parameters: { type: "object", properties: { target: { type: "string", enum: ["hero_name", "hero_role", "hero_intro", "hero_availability", "about_heading", "about_body", "contact_heading", "contact_email", "contact_location", "contact_cta"] }, text: { type: "string" }, polish: { type: "boolean" } }, required: ["target", "text"] } },
  { type: "function", name: "manage_skill", description: "Add, rename, level, or remove a featured skill.", parameters: { type: "object", properties: { action, skill_id: { type: "string", enum: document.skills.map((item) => item.id), description: document.skills.map((item) => `${item.id}: ${item.label}`).join("; ") }, label: { type: "string", maxLength: 32 }, level: { type: "number", minimum: 1, maximum: 5 } }, required: ["action"] } },
  { type: "function", name: "manage_social_link", description: "Add, update, or remove a Contact social profile. URLs must be complete http or https links.", parameters: { type: "object", properties: { action, item_id: idParameter(document.content.contact.socials.map((item) => ({ id: item.id, label: item.platform }))), platform: { type: "string", enum: ["facebook", "instagram", "linkedin", "x", "youtube", "tiktok", "github", "website", "medium", "pinterest"] }, url: { type: "string" } }, required: ["action"] } },
  { type: "function", name: "manage_experience", description: "Add, update, or remove experience using only facts stated by the user.", parameters: { type: "object", properties: { action, item_id: idParameter(document.content.experience.map((item) => ({ id: item.id, label: item.role }))), role: { type: "string" }, organization: { type: "string" }, period: { type: "string" }, summary: { type: "string" }, polish_summary: { type: "boolean" } }, required: ["action"] } },
  { type: "function", name: "manage_education", description: "Add, update, or remove education using only facts stated by the user.", parameters: { type: "object", properties: { action, item_id: idParameter(document.content.education.map((item) => ({ id: item.id, label: item.credential }))), credential: { type: "string" }, institution: { type: "string" }, period: { type: "string" }, summary: { type: "string" }, polish_summary: { type: "boolean" } }, required: ["action"] } },
  { type: "function", name: "manage_project", description: "Add, update, remove, or reorder project case studies. Edit only facts supplied by the user; never invent outcomes, metrics, roles, dates, or technologies.", parameters: { type: "object", properties: { action: { type: "string", enum: ["add", "update", "remove", "move"] }, item_id: idParameter(document.content.projects.map((item) => ({ id: item.id, label: item.title }))), title: { type: "string" }, summary: { type: "string" }, role: { type: "string" }, period: { type: "string" }, challenge: { type: "string" }, approach: { type: "string" }, outcome: { type: "string" }, case_study_slug: { type: "string" }, technologies: { type: "array", items: { type: "string" }, maxItems: 8 }, link: { type: "string" }, direction: { type: "string", enum: ["up", "down"] }, polish_summary: { type: "boolean" } }, required: ["action"] } },
  { type: "function", name: "manage_page_or_post", description: "Create, edit, or remove a standalone site-page or blog-article draft. Blog articles are collected on one Blog page. This tool cannot publish content or upload images; guide the user to use the visible image upload control when media is requested.", parameters: { type: "object", properties: { action, kind: { type: "string", enum: ["page", "post"] }, item_id: idParameter([...document.publishing.pages, ...document.publishing.posts].map((item) => ({ id: item.id, label: item.title }))), title: { type: "string" }, slug: { type: "string" }, seo_title: { type: "string" }, seo_description: { type: "string" }, navigation_label: { type: "string" }, excerpt: { type: "string" }, tags: { type: "array", items: { type: "string" }, maxItems: 8 } }, required: ["action", "kind"] } },
  { type: "function", name: "manage_content_block", description: "Add, edit, move, or remove a structured text block inside a standalone page or blog-article draft. The page title is H1; content headings may use H2 through H6. Supports paragraphs, quotes, bullet lists, and numbered lists. Images must be uploaded manually. This tool cannot publish.", parameters: { type: "object", properties: { action: { type: "string", enum: ["add", "update", "remove", "move"] }, kind: { type: "string", enum: ["page", "post"] }, item_id: { type: "string" }, block_id: { type: "string" }, block_type: { type: "string", enum: ["heading", "paragraph", "quote", "list", "ordered-list"] }, heading_level: { type: "string", enum: ["h2", "h3", "h4", "h5", "h6"] }, text: { type: "string" }, items: { type: "array", items: { type: "string" }, maxItems: 12 }, direction: { type: "string", enum: ["up", "down"] } }, required: ["action", "kind", "item_id"] } },
  { type: "function", name: "set_section", description: "Show, hide, or reorder a portfolio section. Use target_index for exact drag-equivalent placement.", parameters: { type: "object", properties: { section: { type: "string", enum: ["about", "experience", "skills", "projects", "contact"] }, visible: { type: "boolean" }, direction: { type: "string", enum: ["up", "down"] }, target_index: { type: "number", minimum: 0, maximum: 4 } }, required: ["section"] } },
  { type: "function", name: "set_color_theme", description: "Change the approved accent or background theme.", parameters: { type: "object", properties: { accent: { type: "string", enum: ["cyan", "violet", "coral", "lime"] }, background: { type: "string", enum: ["midnight", "ink", "plum", "cloud", "ivory"] } } } },
  { type: "function", name: "set_portfolio_template", description: "Switch the reusable presentation template without changing the user's content.", parameters: { type: "object", properties: { template: { type: "string", enum: ["cinematic-orbit", "architectural-grid", "editorial-depth", "kinetic-gallery", "velocity-atelier"] } }, required: ["template"] } },
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
      case "navigate_to": {
        const navigation = navigationForDestination(string("destination"), string("item_id"));
        if (!navigation) return { ok: false, error: "That Studio destination is not supported." };
        return { ok: true, message: `Opened ${navigationLabel(navigation.section)} in the Studio and Live Canvas.`, navigation };
      }
      case "update_text_content": {
        const target = string("target"), raw = string("text");
        if (!raw) return { ok: false, error: "Provide the text to apply." };
        const polishTarget = target === "hero_intro" || target === "about_body" ? target : null;
        const text = values.polish === true && polishTarget && polish ? await polish(raw, polishTarget) : raw;
        const command = textCommand(target, text);
        if (!command) return { ok: false, error: "That text target is not supported." };
        execute(command); return { ok: true, message: values.polish === true && polishTarget ? "Refined and updated the requested text." : "Updated the requested text.", navigation: { section: target.startsWith("hero_") ? "hero" : target.startsWith("about_") ? "about" : "contact", panel: "content" } };
      }
      case "manage_opportunity_variant": {
        let changes = 0;
        for (const [argument, field] of [["title", "title"], ["brief", "brief"], ["audience", "audience"], ["approval_notes", "approvalNotes"]] as const) {
          if (typeof values[argument] === "string") { execute({ type: "opportunity.set", field, value: string(argument) }); changes += 1; }
        }
        if (["draft", "review", "published", "archived"].includes(string("status"))) { execute({ type: "opportunity.setStatus", status: string("status") as "draft" | "review" | "published" | "archived" }); changes += 1; }
        if (["private", "shared", "public"].includes(string("visibility"))) { execute({ type: "opportunity.setVisibility", visibility: string("visibility") as "private" | "shared" | "public" }); changes += 1; }
        if (Array.isArray(values.included_project_ids)) { execute({ type: "opportunity.setIncludedProjects", projectIds: values.included_project_ids.map(String) }); changes += 1; }
        return changes ? { ok: true, message: "Updated the opportunity variant for your review.", navigation: { section: "opportunity", panel: "content" } } : { ok: false, error: "Specify an opportunity field to update." };
      }
      case "manage_skill": {
        const mode = string("action");
        if (mode === "add") execute({ type: "skill.add", label: string("label") });
        else if (mode === "update") execute({ type: "skill.update", skillId: string("skill_id"), ...(string("label") ? { label: string("label") } : {}), ...(typeof values.level === "number" ? { level: values.level } : {}) });
        else if (mode === "remove") execute({ type: "skill.remove", skillId: string("skill_id") });
        else return { ok: false, error: "Choose add, update, or remove." };
        return { ok: true, message: `Skill ${mode} completed.`, navigation: { section: "skills", panel: "content" } };
      }
      case "manage_social_link": {
        const mode = string("action"), url = string("url"), itemId = string("item_id");
        if (url && !/^https?:\/\/[^\s]+$/i.test(url)) return { ok: false, error: "Use a complete social URL beginning with https:// or http://." };
        if (mode === "add") { if (!string("platform") || !url) return { ok: false, error: "Provide a platform and complete URL." }; execute({ type: "social.add", platform: string("platform") as never, url }); }
        else if (mode === "update") { if (!itemId || (!string("platform") && !url)) return { ok: false, error: "Provide the social-link ID and a field to update." }; execute({ type: "social.update", itemId, ...(string("platform") ? { platform: string("platform") as never } : {}), ...(url ? { url } : {}) }); }
        else if (mode === "remove") execute({ type: "social.remove", itemId });
        else return { ok: false, error: "Choose add, update, or remove." };
        return { ok: true, message: `Social link ${mode} completed.`, navigation: { section: "contact", panel: "content" } };
      }
      case "manage_experience": return withNavigation(await manageExperience(values, string, execute, polish), { section: "experience", panel: "content" });
      case "manage_education": return withNavigation(await manageEducation(values, string, execute, polish), { section: "education", panel: "content" });
      case "manage_project": return withNavigation(await manageProject(values, string, execute, polish), { section: "projects", panel: "content" });
      case "manage_page_or_post": return withNavigation(await managePublishing(values, string, execute), { section: string("kind") === "page" ? "site pages" : "blog posts", ...(string("item_id") ? { itemId: string("item_id") } : string("kind") === "post" ? { itemId: "__index__" } : {}), panel: "content" });
      case "manage_content_block": return withNavigation(await manageBlock(values, string, execute), { section: string("kind") === "page" ? "site pages" : "blog posts", itemId: string("item_id"), panel: "content" });
      case "set_section": {
        const section = string("section") as "about" | "experience" | "skills" | "projects" | "contact";
        if (typeof values.visible === "boolean") execute({ type: "section.setVisible", section, value: values.visible });
        if (values.direction === "up" || values.direction === "down") execute({ type: "section.move", section, direction: values.direction });
        if (typeof values.target_index === "number") execute({ type: "section.moveTo", section, targetIndex: values.target_index });
        if (typeof values.visible !== "boolean" && !values.direction && typeof values.target_index !== "number") return { ok: false, error: "Specify visibility or movement." };
        return { ok: true, message: `Updated the ${section} section.`, navigation: { section, panel: "content" } };
      }
      case "set_color_theme": {
        let changes = 0;
        if (string("accent")) { execute({ type: "design.setAccent", value: string("accent") as never }); changes += 1; }
        if (string("background")) { execute({ type: "design.setBackground", value: string("background") as never }); changes += 1; }
        return changes ? { ok: true, message: `Applied ${changes} approved colour change${changes === 1 ? "" : "s"}.`, navigation: { section: "hero", panel: "design" } } : { ok: false, error: "Specify an approved colour setting." };
      }
      case "set_portfolio_template": execute({ type: "design.setTemplate", value: string("template") as never }); return { ok: true, message: "Applied the requested template while preserving the portfolio content.", navigation: { section: "hero", panel: "design" } };
      case "set_hero_layout": execute({ type: "design.setHeroAlignment", value: string("alignment") as never }); return { ok: true, message: "Updated the Hero alignment.", navigation: { section: "hero", panel: "design" } };
      case "set_scene_style": {
        let changes = 0;
        if (string("preset")) { execute({ type: "scene.setPreset", value: string("preset") as never }); changes += 1; }
        if (string("motion")) { execute({ type: "scene.setMotion", value: string("motion") as never }); changes += 1; }
        if (typeof values.intensity === "number") { execute({ type: "scene.setIntensity", value: values.intensity }); changes += 1; }
        return changes ? { ok: true, message: "Updated the 3D scene.", navigation: { section: "hero", panel: "scene" } } : { ok: false, error: "Specify a scene setting." };
      }
      case "focus_skill": execute({ type: "scene.focusSkill", skillId: string("skill_id") }); return { ok: true, message: "Focused the requested skill.", navigation: { section: "skills", panel: "scene" } };
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
  else if (mode === "move") execute({ type: "project.move", itemId: id, direction: string("direction") as "up" | "down" });
  else if (mode === "update") {
    if (typeof values.title === "string") execute({ type: "project.update", itemId: id, field: "title", value: string("title") });
    if (typeof values.summary === "string") execute({ type: "project.update", itemId: id, field: "summary", value: summary });
    if (technologies) execute({ type: "project.update", itemId: id, field: "technologies", value: technologies });
    if (typeof values.link === "string") execute({ type: "project.update", itemId: id, field: "link", value: string("link") });
    for (const [argument, field] of [["role", "role"], ["period", "period"], ["challenge", "challenge"], ["approach", "approach"], ["outcome", "outcome"], ["case_study_slug", "caseStudySlug"]] as const) {
      if (typeof values[argument] === "string") execute({ type: "project.update", itemId: id, field, value: string(argument) });
    }
  } else return { ok: false, error: "Choose add, update, or remove." };
  return { ok: true, message: `Project ${mode} completed.` };
}

async function managePublishing(values: Record<string, unknown>, string: (key: string) => string, execute: Execute): Promise<VoiceToolResult> {
  const mode = string("action"), kind = string("kind") as "page" | "post", itemId = string("item_id");
  if (mode === "add") execute({ type: "publishing.add", kind, title: string("title") || undefined });
  else if (mode === "remove") execute({ type: "publishing.remove", kind, itemId });
  else if (mode === "update") {
    const fields = [["title", "title"], ["slug", "slug"], ["seo_title", "seoTitle"], ["seo_description", "seoDescription"], ["navigation_label", "navigationLabel"], ["excerpt", "excerpt"]] as const;
    for (const [argument, field] of fields) if (typeof values[argument] === "string") execute({ type: "publishing.update", kind, itemId, field, value: string(argument) });
    if (Array.isArray(values.tags)) execute({ type: "publishing.update", kind, itemId, field: "tags", value: values.tags.map(String) });
  } else return { ok: false, error: "Choose add, update, or remove." };
  return { ok: true, message: `${kind === "page" ? "Page" : "Blog post"} draft ${mode} completed.` };
}

async function manageBlock(values: Record<string, unknown>, string: (key: string) => string, execute: Execute): Promise<VoiceToolResult> {
  const mode = string("action"), kind = string("kind") as "page" | "post", itemId = string("item_id"), blockId = string("block_id");
  if (mode === "add") execute({ type: "block.add", kind, itemId, blockType: string("block_type") as "heading" | "paragraph" | "quote" | "list" | "ordered-list" });
  else if (mode === "remove") execute({ type: "block.remove", kind, itemId, blockId });
  else if (mode === "move") execute({ type: "block.move", kind, itemId, blockId, direction: string("direction") as "up" | "down" });
  else if (mode === "update") {
    if (typeof values.text === "string") execute({ type: "block.update", kind, itemId, blockId, field: "text", value: string("text") });
    if (typeof values.heading_level === "string") execute({ type: "block.update", kind, itemId, blockId, field: "headingLevel", value: string("heading_level") });
    if (Array.isArray(values.items)) execute({ type: "block.update", kind, itemId, blockId, field: "items", value: values.items.map(String) });
  } else return { ok: false, error: "Choose add, update, remove, or move." };
  return { ok: true, message: `Structured content block ${mode} completed.` };
}

async function maybePolish(values: Record<string, unknown>, text: string, target: PolishTarget, polish?: Polish) { return values.polish_summary === true && text && polish ? polish(text, target) : text; }
function safeParse(value: string): unknown { try { return JSON.parse(value); } catch { return null; } }

function withNavigation(result: VoiceToolResult, navigation: AssistantNavigation): VoiceToolResult {
  return result.ok ? { ...result, navigation } : result;
}

function navigationForDestination(destination: string, itemId: string): AssistantNavigation | null {
  const content: Record<string, string> = {
    hero: "hero", about: "about", experience: "experience", education: "education", skills: "skills",
    projects: "projects", contact: "contact", opportunity: "opportunity", site_pages: "site pages", blog: "blog posts",
    page_structure: "page structure", media_library: "media library",
  };
  if (destination in content) return { section: content[destination], ...(itemId ? { itemId } : {}), panel: "content" };
  if (destination === "design") return { section: "hero", panel: "design" };
  if (destination === "scene") return { section: "hero", panel: "scene" };
  return null;
}

function navigationLabel(section: string) {
  return section.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
