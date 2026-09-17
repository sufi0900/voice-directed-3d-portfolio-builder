import type { SiteDocument } from "./site-document";

export const templateOptions = ["cinematic-orbit", "architectural-grid", "editorial-depth"] as const;
export type TemplateId = typeof templateOptions[number];

export type TemplateContract = {
  id: TemplateId;
  name: string;
  description: string;
  audience: string;
  presentation: {
    accent: SiteDocument["design"]["accent"];
    background: SiteDocument["design"]["background"];
    heroAlignment: SiteDocument["design"]["heroAlignment"];
    sceneFamily: SiteDocument["scene"]["family"];
    scenePreset: SiteDocument["scene"]["preset"];
    motion: SiteDocument["scene"]["motion"];
    intensity: number;
  };
};

export const TEMPLATE_CONTRACTS: readonly TemplateContract[] = [
  {
    id: "cinematic-orbit",
    name: "Cinematic Orbit",
    description: "Immersive split-screen storytelling with an interactive orbital capability system.",
    audience: "Creators and AI professionals",
    presentation: { accent: "cyan", background: "midnight", heroAlignment: "left", sceneFamily: "orbital-showcase", scenePreset: "cosmic", motion: "calm", intensity: .9 },
  },
  {
    id: "architectural-grid",
    name: "Architectural Grid",
    description: "A technical, structured composition with a connected constellation field.",
    audience: "Engineers and technical specialists",
    presentation: { accent: "violet", background: "ink", heroAlignment: "left", sceneFamily: "constellation-field", scenePreset: "architect", motion: "dynamic", intensity: 1.05 },
  },
  {
    id: "editorial-depth",
    name: "Editorial Depth",
    description: "A centered editorial composition with restrained motion and generous reading space.",
    audience: "Writers, consultants and strategists",
    presentation: { accent: "coral", background: "plum", heroAlignment: "center", sceneFamily: "constellation-field", scenePreset: "minimal", motion: "calm", intensity: .7 },
  },
] as const;

export function getTemplateContract(id: TemplateId) {
  return TEMPLATE_CONTRACTS.find((template) => template.id === id)!;
}

export function applyTemplatePresentation(document: SiteDocument, id: TemplateId): SiteDocument {
  const { presentation } = getTemplateContract(id);
  return {
    ...document,
    design: { template: id, accent: presentation.accent, background: presentation.background, heroAlignment: presentation.heroAlignment },
    scene: { ...document.scene, family: presentation.sceneFamily, preset: presentation.scenePreset, motion: presentation.motion, intensity: presentation.intensity },
  };
}
