import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { applyTemplatePresentation, templateOptions } from "@/domain/template-contracts";
import { DEFAULT_SITE_DOCUMENT, type SiteDocument } from "@/domain/site-document";

// The app uses Next's automatic JSX runtime; Vitest here uses the classic transform, so expose React
// globally and import the component afterwards (keeps the shared Vitest config untouched).
let PortfolioSections: typeof import("./portfolio-sections").PortfolioSections;
beforeAll(async () => {
  (globalThis as { React?: typeof React }).React = React;
  ({ PortfolioSections } = await import("./portfolio-sections"));
});

const render = (document: SiteDocument, editing = false) => renderToStaticMarkup(<PortfolioSections document={document} editing={editing} />);
const withTemplate = (id: (typeof templateOptions)[number]) => applyTemplatePresentation(DEFAULT_SITE_DOCUMENT, id);

describe("section cinema rendering", () => {
  it.each(["cinematic-orbit", "architectural-grid", "editorial-depth"] as const)("adds a 3D scene to every homepage section for %s", (id) => {
    const html = render(withTemplate(id));
    expect(html).toContain("portfolio-sections cinema-on");
    expect(html).toContain(`data-cinema-template="${id}"`);
    for (const kind of ["about", "experience", "skills", "projects"]) expect(html).toContain(`cine-scene cine-${kind}`);
    expect(html).toContain("cine-scene cine-contact");
  });

  it("renders decorative scenes as hidden from assistive technology", () => {
    const html = render(withTemplate("cinematic-orbit"));
    const scenes = html.match(/<div class="cine-scene[^>]*>/g) ?? [];
    expect(scenes.length).toBeGreaterThanOrEqual(4);
    for (const tag of scenes) expect(tag).toContain('aria-hidden="true"');
  });

  it("leaves Kinetic Gallery completely untouched", () => {
    const id = "kinetic-gallery" as const;
    const html = render(withTemplate(id));
    expect(html).not.toContain("cinema-on");
    expect(html).not.toContain("cine-scene");
    expect(html).toContain('class="portfolio-sections"');
    expect(html).toContain("cinematic-backdrop");
  });

  it("gives Velocity Atelier its own automotive scene for every section", () => {
    const html = render(withTemplate("velocity-atelier"));
    expect(html).toContain('data-cinema-template="velocity-atelier"');
    for (const marker of ["vx-wheel", "vx-road", "vx-cluster", "vx-rail", "vx-lamp"]) expect(html).toContain(marker);
    expect(html).not.toContain("cine-gem");
    expect(html).not.toContain("cine-gyro");
    expect(html).not.toContain("beacon-orb");
  });

  it("keeps all content in the markup so it is readable without JavaScript", () => {
    const html = render(withTemplate("cinematic-orbit"));
    expect(html).toContain(DEFAULT_SITE_DOCUMENT.content.projects[0].title);
    expect(html).toContain(DEFAULT_SITE_DOCUMENT.skills[0].label);
    expect(html).not.toContain("data-cinema-ready");
  });

  it("publishes the motion and amplitude contract as data attributes and variables", () => {
    const calm = render({ ...withTemplate("cinematic-orbit"), scene: { ...withTemplate("cinematic-orbit").scene, motion: "still", intensity: 1.2 } });
    expect(calm).toContain('data-motion="still"');
    expect(calm).toContain("--cine-i:1.2");
    const editorial = render(withTemplate("editorial-depth"));
    expect(editorial).toContain("--cine-i:0.49");
  });
});
