import type { SiteDocument } from "./site-document";

export const templateOptions = ["cinematic-orbit", "architectural-grid", "editorial-depth", "kinetic-gallery", "velocity-atelier", "professional-2d"] as const;
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
  {
    id: "kinetic-gallery",
    name: "Kinetic Gallery",
    description: "An editorial 3D gallery of suspended project panels and a luminous monolith—no orbital motifs.",
    audience: "Designers, directors and visual storytellers",
    presentation: { accent: "lime", background: "ink", heroAlignment: "left", sceneFamily: "kinetic-gallery", scenePreset: "architect", motion: "calm", intensity: .85 },
  },
  {
    id: "velocity-atelier",
    name: "Velocity Atelier",
    description: "A night-showroom automotive stage with a sculpted GT coupe, cruising light streaks and cinematic 3D sections.",
    audience: "Product designers, technologists and ambitious independent creators",
    presentation: { accent: "coral", background: "ink", heroAlignment: "left", sceneFamily: "velocity-roadster", scenePreset: "minimal", motion: "dynamic", intensity: 1.05 },
  },
  {
    id: "professional-2d",
    name: "Professional 2D",
    description: "A clean, accessible light-mode layout with no 3D scene — pure typography and whitespace.",
    audience: "Corporate professionals, academics, and minimalists",
    presentation: { accent: "violet", background: "ivory", heroAlignment: "center", sceneFamily: "professional-2d", scenePreset: "minimal", motion: "still", intensity: 0.4 },
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
    scene: { ...document.scene, family: presentation.sceneFamily, preset: presentation.scenePreset, motion: presentation.motion, intensity: presentation.intensity, focusedSkill: id === "velocity-atelier" ? null : document.scene.focusedSkill },
  };
}
