"use client";

import dynamic from "next/dynamic";
import type { SiteCommand } from "@/domain/commands";
import type { SiteDocument } from "@/domain/site-document";

const OrbitalShowcase = dynamic(() => import("./orbital-showcase").then((module) => module.OrbitalShowcase), { ssr: false, loading: () => <div className="scene-loading">Preparing Orbital Showcase…</div> });
const ConstellationField = dynamic(() => import("./constellation-field").then((module) => module.ConstellationField), { ssr: false, loading: () => <div className="scene-loading">Preparing Constellation Field…</div> });

export function SceneRenderer(props: { document: SiteDocument; execute: (command: SiteCommand) => void; reducedMotion: boolean }) {
  return props.document.scene.family === "constellation-field" ? <ConstellationField {...props} /> : <OrbitalShowcase {...props} />;
}
