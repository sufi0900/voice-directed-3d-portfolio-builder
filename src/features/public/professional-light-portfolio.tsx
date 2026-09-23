import { useEffect, useState } from "react";
import type { SiteDocument } from "@/domain/site-document";
import { PortfolioNavigation, PortfolioSections } from "@/features/portfolio/portfolio-sections";

export function ProfessionalLightPortfolio({ document, slug, basePath }: { document: SiteDocument; slug: string; basePath?: string }) {
  const path = basePath ?? `/p/${slug}`;
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const initials = document.identity.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VF";
  return <main className="professional-light-site" data-accent={document.design.accent} data-reduced-motion={reducedMotion ? "true" : "false"}>
    <header className="professional-light-nav"><a className="professional-light-brand" href={path}><span>{initials}</span><strong>{document.identity.name}</strong></a><PortfolioNavigation document={document} publicBasePath={path} /></header>
    <section className="professional-light-hero">
      <div className="professional-light-copy">
        <p className="professional-light-kicker">{document.opportunity.status === "canonical" ? "PROFESSIONAL PORTFOLIO" : document.opportunity.title || "OPPORTUNITY PORTFOLIO"}</p>
        <h1>{document.identity.name}</h1>
        <h2>{document.identity.role}</h2>
        <p className="professional-light-intro">{document.identity.intro}</p>
        <div className="professional-light-actions"><a href={`${path}/projects`}>View selected work</a><a className="secondary" href="#contact">Start a conversation</a></div>
      </div>
      <aside className="professional-light-profile"><span>{initials}</span><strong>{document.identity.availability}</strong><small>{document.content.contact.location || "Available worldwide"}</small></aside>
    </section>
    <div className="professional-light-content"><PortfolioSections document={document} publicBasePath={path} /></div>
    <footer className="professional-light-footer"><span>{document.identity.name}</span><small>Published revision {document.revision}</small></footer>
  </main>;
}
