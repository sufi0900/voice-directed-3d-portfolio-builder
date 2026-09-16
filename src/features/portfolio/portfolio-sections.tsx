import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import type { PortfolioSection, SiteDocument } from "@/domain/site-document";

const sectionLabels: Record<PortfolioSection, string> = {
  about: "About",
  experience: "Experience",
  skills: "Skills",
  projects: "Projects",
  contact: "Contact",
};

export function PortfolioNavigation({ document }: { document: SiteDocument }) {
  return <nav className="portfolio-site-nav" aria-label="Portfolio sections">
    {document.content.order.filter((section) => document.content.visibility[section]).map((section) => <a key={section} href={`#${section}`}>{sectionLabels[section]}</a>)}
  </nav>;
}

export function PortfolioSections({ document, editing = false }: { document: SiteDocument; editing?: boolean }) {
  return <div className="portfolio-sections">
    {document.content.order.map((section) => document.content.visibility[section] ? <Section key={section} section={section} document={document} editing={editing} /> : null)}
  </div>;
}

function Section({ section, document, editing }: { section: PortfolioSection; document: SiteDocument; editing: boolean }) {
  if (section === "about") {
    const body = document.content.about.body || document.identity.intro;
    return <section id="about" className={`portfolio-section about-section ${document.media.headshotUrl ? "has-headshot" : ""}`}><SectionHeading eyebrow="PROFILE" title={document.content.about.heading} /><div className="about-layout">{document.media.headshotUrl && <div className="about-headshot"><Image src={document.media.headshotUrl} alt={document.media.headshotAlt || `${document.identity.name} headshot`} fill sizes="(max-width: 780px) 78vw, 340px" unoptimized /></div>}<p className="about-copy">{body}</p></div></section>;
  }
  if (section === "experience") {
    const hasJourney = document.content.experience.length || document.content.education.length;
    if (!hasJourney && !editing) return null;
    return <section id="experience" className="portfolio-section"><SectionHeading eyebrow="JOURNEY" title="Experience & education" />{hasJourney ? <div className="experience-list">{document.content.experience.map((item) => <article key={item.id}><div><span>{item.period || "Present"}</span><i /></div><div><h3>{item.role}</h3>{item.organization && <strong>{item.organization}</strong>}<p>{item.summary}</p></div></article>)}{document.content.education.map((item) => <article key={item.id} className="education-entry"><div><span>{item.period || "Education"}</span><i /></div><div><h3>{item.credential}</h3>{item.institution && <strong>{item.institution}</strong>}<p>{item.summary}</p></div></article>)}</div> : <EmptyState label="Add experience or education entries from the Content editor." />}</section>;
  }
  if (section === "skills") return <section id="skills" className="portfolio-section"><SectionHeading eyebrow="CAPABILITIES" title="Core skills" /><div className="capability-grid">{document.skills.map((skill) => <article key={skill.id}><span>{String(skill.level).padStart(2, "0")}/05</span><h3>{skill.label}</h3><div><i style={{ width: `${skill.level * 20}%` }} /></div></article>)}</div></section>;
  if (section === "projects") {
    if (!document.content.projects.length && !editing) return null;
    return <section id="projects" className="portfolio-section"><SectionHeading eyebrow="SELECTED WORK" title="Projects" />{document.content.projects.length ? <div className="work-grid">{document.content.projects.map((project, index) => <article key={project.id}><span>0{index + 1}</span><h3>{project.title}</h3><p>{project.summary}</p><div className="technology-list">{project.technologies.map((technology) => <em key={technology}>{technology}</em>)}</div>{project.link && <a href={project.link} target="_blank" rel="noreferrer">View project <ArrowUpRight size={15} /></a>}</article>)}</div> : <EmptyState label="Add selected work in Content → Projects." />}</section>;
  }
  const contact = document.content.contact;
  if (!contact.email && !contact.location && !editing) return null;
  return <section id="contact" className="portfolio-section contact-section"><p className="section-eyebrow">CONTACT</p><h2>{contact.heading}</h2><div>{contact.email ? <a className="contact-cta" href={`mailto:${contact.email}`}><Mail size={17} />{contact.cta}</a> : editing ? <span className="contact-cta disabled"><Mail size={17} />Add an email to activate</span> : null}{contact.location && <span className="contact-location"><MapPin size={16} />{contact.location}</span>}</div></section>;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <header className="section-heading"><p className="section-eyebrow">{eyebrow}</p><h2>{title}</h2></header>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="portfolio-empty-state">{label}</div>;
}
