"use client";

import { useEffect, useState } from "react";
import type { SiteDocument } from "@/domain/site-document";
import { PortfolioNavigation, PortfolioSections } from "@/features/portfolio/portfolio-sections";
import { SceneRenderer } from "@/features/scene/scene-renderer";
import { ProfessionalLightPortfolio } from "@/features/public/professional-light-portfolio";

const backgroundClass = { midnight: "bg-midnight", ink: "bg-ink", plum: "bg-plum", cloud: "bg-cloud", ivory: "bg-ivory" } as const;

export function PublicPortfolio({ document, slug, basePath }: { document: SiteDocument; slug: string; basePath?: string }) {
  if (document.design.template === "professional-light") return <ProfessionalLightPortfolio document={document} slug={slug} basePath={basePath} />;
  const path = basePath ?? `/p/${slug}`;
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync(); preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  const focusedSkill = document.skills.find((skill) => skill.id === document.scene.focusedSkill);
  const initials = document.identity.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VF";
  return <main className={`studio public-site template-${document.design.template} ${backgroundClass[document.design.background]}`} data-accent={document.design.accent}>
    <header className="public-nav"><a className="public-identity" href={path}><i>{initials}</i><strong>{document.identity.name}</strong></a><PortfolioNavigation document={document} publicBasePath={path} /></header>
    <div className="portfolio-preview" aria-label={`${document.identity.name}'s portfolio`}>
      <section className={`portfolio-hero align-${document.design.heroAlignment}`}>
        <div className="ambient-grid" /><div className="portfolio-copy"><p className="availability"><i />{document.identity.availability}</p><p className="kicker">{document.opportunity.status === "canonical" ? "PROFESSIONAL PORTFOLIO" : document.opportunity.title || "OPPORTUNITY PORTFOLIO"}</p><h1>{document.identity.name}</h1><h2>{document.identity.role}</h2><p className="intro">{document.identity.intro}</p><div className="hero-actions"><a href={`${path}/projects`}>View selected work</a><a className="ghost" href="#contact">Start a conversation</a></div>{focusedSkill && <div className="focus-card"><span>FEATURED CAPABILITY</span><strong>{focusedSkill.label}</strong><p>Capability level {focusedSkill.level}/5</p></div>}</div>
        <div className="scene-stage"><SceneRenderer document={document} execute={() => undefined} reducedMotion={reducedMotion} /></div>
      </section>
      <PortfolioSections document={document} publicBasePath={path} />
    </div>
    <footer className="public-footer"><span>Built with Voxfolio</span><small>Published revision {document.revision}</small></footer>
  </main>;
}
