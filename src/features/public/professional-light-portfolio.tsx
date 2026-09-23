"use client";

import type { SiteDocument } from "@/domain/site-document";
import { PortfolioNavigation, PortfolioSections } from "@/features/portfolio/portfolio-sections";

export function ProfessionalLightPortfolio({ document, basePath }: { document: SiteDocument; basePath: string }) {
  const initials = document.identity.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VF";
  return <main className="professional-light-site" data-accent={document.design.accent}>
    <header className="professional-light-nav">
      <a className="professional-light-brand" href={basePath}><span>{initials}</span><strong>{document.identity.name}</strong></a>
      <PortfolioNavigation document={document} publicBasePath={basePath} />
    </header>
    <section className="professional-light-hero">
      <div><p className="professional-light-kicker">{document.opportunity.status === "canonical" ? "PROFESSIONAL PORTFOLIO" : document.opportunity.title || "OPPORTUNITY PORTFOLIO"}</p><h1>{document.identity.name}</h1><h2>{document.identity.role}</h2><p>{document.identity.intro}</p><a className="professional-light-button" href={`${basePath}/projects`}>View selected work</a></div>
      <aside className="professional-light-profile" aria-label="Professional availability"><span>{initials}</span><strong>{document.identity.availability}</strong><small>{document.content.contact.location || "Available worldwide"}</small></aside>
    </section>
    <div className="professional-light-content"><PortfolioSections document={document} publicBasePath={basePath} /></div>
    <footer className="professional-light-footer"><span>{document.identity.name}</span><small>Published revision {document.revision}</small></footer>
  </main>;
}
