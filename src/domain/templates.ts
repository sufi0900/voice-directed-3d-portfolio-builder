import { DEFAULT_SITE_DOCUMENT, type CvProvenance, type SiteDocument } from "./site-document";
import { applyGuidedInterview, type GuidedInterview } from "./guided-interview";

export type PortfolioTemplate = {
  id: string;
  name: string;
  description: string;
  mode: "3d" | "2d";
  audience: string;
  document: SiteDocument;
};

const base = (overrides: Partial<SiteDocument>): SiteDocument => ({
  ...DEFAULT_SITE_DOCUMENT,
  ...overrides,
  identity: { ...DEFAULT_SITE_DOCUMENT.identity, ...overrides.identity },
  design: { ...DEFAULT_SITE_DOCUMENT.design, ...overrides.design },
  scene: { ...DEFAULT_SITE_DOCUMENT.scene, ...overrides.scene },
  skills: overrides.skills ?? DEFAULT_SITE_DOCUMENT.skills,
});

export const PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  { id: "orbital-creator", name: "Orbital Creator", description: "Cinematic skill system with a calm orbital scene.", mode: "3d", audience: "Designers & creators", document: base({ design: { accent: "cyan", background: "midnight", heroAlignment: "left" }, scene: { family: "orbital-showcase", preset: "cosmic", motion: "calm", intensity: .9, focusedSkill: null } }) },
  { id: "architect-grid", name: "Architect Grid", description: "Structured geometry for technical specialists.", mode: "3d", audience: "Developers & engineers", document: base({ design: { accent: "violet", background: "ink", heroAlignment: "left" }, scene: { family: "orbital-showcase", preset: "architect", motion: "dynamic", intensity: 1.05, focusedSkill: null } }) },
  { id: "minimal-signal", name: "Minimal Signal", description: "Restrained motion and crisp visual hierarchy.", mode: "3d", audience: "Consultants & strategists", document: base({ design: { accent: "lime", background: "cloud", heroAlignment: "center" }, scene: { family: "orbital-showcase", preset: "minimal", motion: "calm", intensity: .7, focusedSkill: null } }) },
  { id: "editorial-profile", name: "Editorial Profile", description: "A professional, low-motion portfolio foundation.", mode: "2d", audience: "Writers & professionals", document: base({ design: { accent: "coral", background: "plum", heroAlignment: "left" }, scene: { family: "orbital-showcase", preset: "minimal", motion: "still", intensity: .5, focusedSkill: null } }) },
];

export function getTemplate(id: string) {
  return PORTFOLIO_TEMPLATES.find((template) => template.id === id);
}

export function buildGuidedDocument(input: { name: string; role: string; intro: string; skills?: string[]; education?: string[]; style: "creative" | "technical" | "minimal"; projectId?: string; cv?: CvProvenance; interview?: GuidedInterview }): SiteDocument {
  const templateId = input.style === "technical" ? "architect-grid" : input.style === "minimal" ? "minimal-signal" : "orbital-creator";
  const template = getTemplate(templateId)!;
  const approved = input.cv?.approvedFacts ?? [];
  const fact = (kind: "name" | "role" | "intro") => approved.find((item) => item.kind === kind)?.value;
  const cvSkills = approved.filter((item) => item.kind === "skill").slice(0, 8).map((item, index) => ({
    id: `cv-skill-${index + 1}`,
    label: item.value.slice(0, 32),
    level: 4,
  }));
  const suppliedSkills = (input.skills ?? []).slice(0, 8).map((label, index) => ({ id: `guided-skill-${index + 1}`, label: label.slice(0, 32), level: 3 }));
  const selectedSkills = cvSkills.length ? cvSkills : suppliedSkills;
  const skills = selectedSkills.length === 0
    ? template.document.skills
    : selectedSkills.length >= 3
      ? selectedSkills
      : [...selectedSkills, ...template.document.skills.filter((defaultSkill) => !selectedSkills.some((skill) => skill.label.toLowerCase() === defaultSkill.label.toLowerCase()))].slice(0, 3);
  const cvEducation = approved.filter((item) => item.kind === "education").map((item) => item.value);
  const education = (cvEducation.length ? cvEducation : input.education ?? []).slice(0, 8).map((credential, index) => ({ id: `education-${index + 1}`, credential: credential.slice(0, 140), institution: "", period: "", summary: "" }));
  const document: SiteDocument = {
    ...template.document,
    projectId: input.projectId ?? crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
    identity: {
      ...template.document.identity,
      name: fact("name") ?? input.name,
      role: fact("role") ?? input.role,
      intro: fact("intro") ?? input.intro,
    },
    skills,
    content: { ...template.document.content, education },
    provenance: input.cv ? { cv: input.cv } : undefined,
  };
  return input.interview ? applyGuidedInterview(document, input.interview) : document;
}
