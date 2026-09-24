import { DEFAULT_SITE_DOCUMENT, type CvProvenance, type SiteDocument } from "./site-document";
import { applyGuidedInterview, type GuidedInterview } from "./guided-interview";
import { TEMPLATE_CONTRACTS, type TemplateId } from "./template-contracts";

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
  ...TEMPLATE_CONTRACTS.map((template) => ({ id: template.id, name: template.name, description: template.description, mode: template.id === "professional-2d" ? "2d" as const : "3d" as const, audience: template.audience, document: base({ design: { template: template.id, accent: template.presentation.accent, background: template.presentation.background, heroAlignment: template.presentation.heroAlignment }, scene: { family: template.presentation.sceneFamily, preset: template.presentation.scenePreset, motion: template.presentation.motion, intensity: template.presentation.intensity, focusedSkill: null } }) })),
];

export function getTemplate(id: string) {
  return PORTFOLIO_TEMPLATES.find((template) => template.id === id);
}

export function buildGuidedDocument(input: { name: string; role: string; intro: string; skills?: string[]; education?: string[]; style: "creative" | "technical" | "minimal"; projectId?: string; cv?: CvProvenance; interview?: GuidedInterview }): SiteDocument {
  const templateId: TemplateId = input.style === "technical" ? "architectural-grid" : input.style === "minimal" ? "editorial-depth" : "cinematic-orbit";
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
