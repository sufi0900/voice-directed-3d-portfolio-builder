import { ArrowUpRight, Asterisk } from "lucide-react";
import type { SiteDocument } from "@/domain/site-document";

export function ProfessionalHeroAside({ document }: { document: SiteDocument }) {
  const initials = document.identity.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VF";
  return <div className="professional-hero-aside" aria-hidden="true"><div className="professional-aside-top"><span>PERSONAL PORTFOLIO</span><Asterisk size={28} strokeWidth={1} /></div><strong>{initials}</strong><div className="professional-aside-bottom"><span>INSIGHT<br />MEETS<br />ACTION</span><ArrowUpRight size={40} strokeWidth={1} /></div></div>;
}
