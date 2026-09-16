"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { SiteDocument } from "@/domain/site-document";
import { PortfolioNavigation, PortfolioSections } from "@/features/portfolio/portfolio-sections";

const OrbitalShowcase = dynamic(() => import("@/features/scene/orbital-showcase").then((module) => module.OrbitalShowcase), {
  ssr: false,
  loading: () => <div className="scene-loading">Preparing portfolio experience…</div>,
});
const backgroundClass = { midnight: "bg-midnight", ink: "bg-ink", plum: "bg-plum", cloud: "bg-cloud" } as const;

export function PublicPortfolio({ document }: { document: SiteDocument }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync(); preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  const focusedSkill = document.skills.find((skill) => skill.id === document.scene.focusedSkill);
  const initials = document.identity.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VF";
  return <main className={`studio public-site ${backgroundClass[document.design.background]}`} data-accent={document.design.accent}>
    <header className="public-nav"><a className="public-identity" href="#"><i>{initials}</i><strong>{document.identity.name}</strong></a><PortfolioNavigation document={document} />{document.content.contact.email ? <a className="public-contact-link" href="#contact">Contact</a> : <span />}</header>
    <div className="portfolio-preview" aria-label={`${document.identity.name}'s portfolio`}>
      <section className={`portfolio-hero align-${document.design.heroAlignment}`}>
        <div className="ambient-grid" />
        <div className="portfolio-copy">
        <p className="availability"><i />{document.identity.availability}</p>
        <p className="kicker">PROFESSIONAL PORTFOLIO</p>
        <h1>{document.identity.name}</h1>
        <h2>{document.identity.role}</h2>
        <p className="intro">{document.identity.intro}</p>
        <div className="hero-actions"><button>View selected work</button><button className="ghost">Start a conversation</button></div>
        {focusedSkill && <div className="focus-card"><span>FEATURED CAPABILITY</span><strong>{focusedSkill.label}</strong><p>Capability level {focusedSkill.level}/5</p></div>}
        </div>
        <div className="scene-stage"><OrbitalShowcase document={document} execute={() => undefined} reducedMotion={reducedMotion} /></div>
      </section>
      <PortfolioSections document={document} />
    </div>
    <footer className="public-footer"><span>Built with Voxfolio</span><small>Published revision {document.revision}</small></footer>
  </main>;
}
