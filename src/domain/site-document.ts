import { z } from "zod";

export const accentOptions = ["cyan", "violet", "coral", "lime"] as const;
export const backgroundOptions = ["midnight", "ink", "plum", "cloud"] as const;
export const alignmentOptions = ["left", "center", "right"] as const;
export const scenePresetOptions = ["cosmic", "architect", "minimal"] as const;
export const motionOptions = ["calm", "dynamic", "still"] as const;
export const cvFactKindOptions = ["name", "role", "intro", "skill", "education", "experience"] as const;

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
};

export function validateSiteDocument(value: unknown): SiteDocument {
  return siteDocumentSchema.parse(value);
}
