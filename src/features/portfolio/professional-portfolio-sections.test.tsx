import React from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildGuidedDocument } from "@/domain/templates";
import { applyTemplatePresentation } from "@/domain/template-contracts";
let PortfolioSections: typeof import("./portfolio-sections").PortfolioSections;
let PublicPortfolio: typeof import("@/features/public/public-portfolio").PublicPortfolio;
beforeAll(async () => {
  (globalThis as { React?: typeof React }).React = React;
  ({ PortfolioSections } = await import("./portfolio-sections"));
  ({ PublicPortfolio } = await import("@/features/public/public-portfolio"));
});

const source = buildGuidedDocument({ name: "Amina Khan", role: "Designer", intro: "I make things clear.", style: "minimal", projectId: "test-portfolio" });
const professional = applyTemplatePresentation(source, "professional-2d");

describe("professional portfolio presentation", () => {
  it("renders distinct About, education, skills, work, and contact composition with shared content", () => {
    const markup = renderToStaticMarkup(<PortfolioSections document={professional} editing />);
    expect(markup).toContain('class="professional-about-grid"');
    expect(markup).toContain('class="professional-journey-grid"');
    expect(markup).toContain('class="professional-skills-grid"');
    expect(markup).toContain('class="professional-work-grid"');
    expect(markup).toContain('class="professional-section professional-contact"');
    expect(markup).not.toContain('class="capability-grid"');
    expect(markup).not.toContain('class="cinematic-backdrop"');
    expect(markup).toContain(professional.content.about.body);
  });

  it("keeps the public hero and navigation within the 2D template", () => {
    const markup = renderToStaticMarkup(<PublicPortfolio document={professional} slug="amina" />);
    expect(markup).toContain("template-professional-2d");
    expect(markup).toContain('class="professional-hero-aside"');
    expect(markup).toContain('id="about"');
    expect(markup).toContain('id="skills"');
  });

  it("does not change the 3D template section tree", () => {
    const markup = renderToStaticMarkup(<PortfolioSections document={source} editing />);
    expect(markup).toContain('class="capability-grid"');
    expect(markup).not.toContain('class="professional-skills-grid"');
  });
});
