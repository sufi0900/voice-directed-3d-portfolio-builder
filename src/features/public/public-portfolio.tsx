import type { SiteDocument } from "@/domain/site-document";
import { ProfessionalLightPortfolio } from "@/features/public/professional-light-portfolio";

export function PublicPortfolio({ document, slug, basePath }: { document: SiteDocument; slug: string; basePath?: string }) {
  if (document.design.template === "professional-light") {
    return <ProfessionalLightPortfolio document={document} slug={slug} basePath={basePath} />;
  }
  const path = basePath ?? `/p/${slug}`;
  const backgroundClass = { midnight: "bg-midnight", ink: "bg-ink", plum: "bg-plum", cloud: "bg-cloud", ivory: "bg-ivory" } as const;
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(preference.matches);
    sync(); preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  const focusedSkill = document.skills.find((skill) => skill.id === document.scene.focusedSkill);
  const initials = document.identity.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VF";
  return <main className={`studio public-site template-${document.design.template} ${backgroundClass[document.design.background]}`} data-accent={document.design.accent}> ... ;
}
