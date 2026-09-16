import { z } from "zod";

export const accentOptions = ["cyan", "violet", "coral", "lime"] as const;
export const backgroundOptions = ["midnight", "ink", "plum", "cloud"] as const;
export const alignmentOptions = ["left", "center", "right"] as const;
export const scenePresetOptions = ["cosmic", "architect", "minimal"] as const;
export const motionOptions = ["calm", "dynamic", "still"] as const;
export const cvFactKindOptions = ["name", "role", "intro", "skill", "education", "experience"] as const;
export const portfolioSectionOptions = ["about", "experience", "skills", "projects", "contact"] as const;

export const DEFAULT_PORTFOLIO_CONTENT = {
  order: [...portfolioSectionOptions],
  visibility: { about: true, experience: true, skills: true, projects: true, contact: true },
  about: { heading: "About", body: "" },
  experience: [] as Array<{ id: string; role: string; organization: string; period: string; summary: string }>,
  education: [] as Array<{ id: string; credential: string; institution: string; period: string; summary: string }>,
  projects: [] as Array<{ id: string; title: string; summary: string; technologies: string[]; link: string }>,
  contact: { heading: "Let’s build something useful", email: "", location: "", cta: "Start a conversation" },
};

const portfolioContentSchema = z.object({
  order: z.array(z.enum(portfolioSectionOptions)).length(portfolioSectionOptions.length).refine((items) => new Set(items).size === portfolioSectionOptions.length, "Section order must contain each section once."),
  visibility: z.object({ about: z.boolean(), experience: z.boolean(), skills: z.boolean(), projects: z.boolean(), contact: z.boolean() }),
  about: z.object({ heading: z.string().trim().min(1).max(80), body: z.string().trim().max(900) }),
  experience: z.array(z.object({ id: z.string().min(1), role: z.string().trim().min(1).max(100), organization: z.string().trim().max(100), period: z.string().trim().max(80), summary: z.string().trim().max(500) })).max(8),
  education: z.array(z.object({ id: z.string().min(1), credential: z.string().trim().min(1).max(140), institution: z.string().trim().max(120), period: z.string().trim().max(80), summary: z.string().trim().max(500) })).max(8).default([]),
  projects: z.array(z.object({ id: z.string().min(1), title: z.string().trim().min(1).max(100), summary: z.string().trim().max(500), technologies: z.array(z.string().trim().min(1).max(32)).max(8), link: z.union([z.literal(""), z.string().url()]) })).max(8),
  contact: z.object({ heading: z.string().trim().min(1).max(100), email: z.union([z.literal(""), z.string().email()]), location: z.string().trim().max(100), cta: z.string().trim().min(1).max(60) }),
});

export const approvedCvFactSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(cvFactKindOptions),
  value: z.string().trim().min(1).max(220),
  sourceExcerpt: z.string().trim().min(1).max(320),
});

export const cvProvenanceSchema = z.object({
  sourceId: z.string().min(1),
  fileName: z.string().min(1).max(180),
  mediaType: z.string().min(1).max(120),
  importedAt: z.string(),
  originalStored: z.literal(false),
  approvedFacts: z.array(approvedCvFactSchema).max(40),
});

export const siteDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: z.string().min(1),
  revision: z.number().int().nonnegative(),
  updatedAt: z.string(),
  identity: z.object({
    name: z.string().trim().min(1).max(60),
    role: z.string().trim().min(1).max(80),
    intro: z.string().trim().min(1).max(220),
    availability: z.string().trim().min(1).max(80),
  }),
  design: z.object({
    accent: z.enum(accentOptions),
    background: z.enum(backgroundOptions),
    heroAlignment: z.enum(alignmentOptions),
  }),
  scene: z.object({
    family: z.literal("orbital-showcase"),
    preset: z.enum(scenePresetOptions),
    motion: z.enum(motionOptions),
    intensity: z.number().min(0.4).max(1.4),
    focusedSkill: z.string().nullable(),
  }),
  skills: z.array(z.object({ id: z.string(), label: z.string().min(1).max(32), level: z.number().min(1).max(5) })).min(3).max(8),
  content: portfolioContentSchema.default(DEFAULT_PORTFOLIO_CONTENT),
  media: z.object({ headshotUrl: z.union([z.literal(""), z.string().url()]), headshotAlt: z.string().trim().max(160) }).default({ headshotUrl: "", headshotAlt: "" }),
  guidedInterview: z.object({
    goal: z.enum(["win-clients", "showcase-work", "find-role"]),
    audience: z.enum(["clients", "employers", "collaborators"]),
    tone: z.enum(["bold", "structured", "minimal"]),
    motion: z.enum(["immersive", "balanced", "reduced"]),
    emphasis: z.enum(["skills", "story", "results"]),
  }).optional(),
  provenance: z.object({ cv: cvProvenanceSchema.optional() }).optional(),
});

export type SiteDocument = z.infer<typeof siteDocumentSchema>;
export type Accent = SiteDocument["design"]["accent"];
export type Background = SiteDocument["design"]["background"];
export type HeroAlignment = SiteDocument["design"]["heroAlignment"];
export type ScenePreset = SiteDocument["scene"]["preset"];
export type MotionMode = SiteDocument["scene"]["motion"];
export type PortfolioSection = typeof portfolioSectionOptions[number];
export type ApprovedCvFact = z.infer<typeof approvedCvFactSchema>;
export type CvProvenance = z.infer<typeof cvProvenanceSchema>;

export const DEFAULT_SITE_DOCUMENT: SiteDocument = {
  schemaVersion: 1,
  projectId: "demo-portfolio",
  revision: 0,
  updatedAt: new Date(0).toISOString(),
  identity: {
    name: "Sufian Mustafa",
    role: "AI-Augmented Web Creator",
    intro: "I combine web engineering, search strategy and AI automation to turn complex ideas into useful digital products.",
    availability: "Available for selected projects",
  },
  design: { accent: "cyan", background: "midnight", heroAlignment: "left" },
  scene: { family: "orbital-showcase", preset: "cosmic", motion: "calm", intensity: 0.9, focusedSkill: null },
  skills: [
    { id: "web", label: "Next.js", level: 5 },
    { id: "seo", label: "Technical SEO", level: 5 },
    { id: "ai", label: "AI Automation", level: 4 },
    { id: "content", label: "Content Systems", level: 4 },
    { id: "strategy", label: "Growth Strategy", level: 4 },
  ],
  content: {
    ...DEFAULT_PORTFOLIO_CONTENT,
    about: { heading: "About", body: "I design and build focused digital experiences where strategy, content, and engineering reinforce each other." },
    experience: [
      { id: "experience-1", role: "AI-Augmented Web Creator", organization: "Independent", period: "Current", summary: "Building reusable web systems that combine product thinking, search strategy, and responsible AI workflows." },
    ],
    education: [],
    projects: [
      { id: "project-1", title: "Voxfolio", summary: "A voice-directed portfolio builder with governed editing, revision history, and immutable publishing.", technologies: ["Next.js", "Supabase", "Three.js"], link: "" },
    ],
    contact: { heading: "Let’s build something useful", email: "", location: "Available remotely", cta: "Start a conversation" },
  },
  media: { headshotUrl: "", headshotAlt: "" },
};

export function validateSiteDocument(value: unknown): SiteDocument {
  return siteDocumentSchema.parse(value);
}
