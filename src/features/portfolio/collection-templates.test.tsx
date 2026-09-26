import React from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_SITE_DOCUMENT, validateSiteDocument } from "@/domain/site-document";
import { applySiteCommand } from "@/domain/commands";
import { applyTemplatePresentation } from "@/domain/template-contracts";
import { planLocalAssistant } from "@/features/voice/local-assistant";
import { CollectionPortrait, CollectionSections } from "./collection-templates";
beforeAll(() => { (globalThis as { React?: typeof React }).React = React; });
describe("new template contracts", () => {
  for (const id of ["rose-studio", "midnight-bento", "olive-journal"] as const) {
    it(`${id} switches without losing facts, images or publication content`, () => {
      const source = { ...DEFAULT_SITE_DOCUMENT, media: { ...DEFAULT_SITE_DOCUMENT.media, headshotUrl:"https://example.com/portrait.jpg", headshotAlt:"My portrait" } };
      const result = applySiteCommand(source,{type:"design.setTemplate",value:id});
      expect(validateSiteDocument(result)).toEqual(result);
      expect(result.identity).toEqual(source.identity);
      expect(result.content).toEqual(source.content);
      expect(result.media).toEqual(source.media);
      expect(result.publishing).toEqual(source.publishing);
      const markup=renderToStaticMarkup(<><CollectionPortrait document={result}/><CollectionSections document={result} editing/></>);
      expect(markup).toContain('alt="My portrait"');
      for(const section of source.content.order) expect(markup).toContain(`id="${section}"`);
      expect(markup).not.toContain("canvas");
      expect(planLocalAssistant(`Switch to ${id}`)?.calls[0]).toEqual({name:"set_portfolio_template",arguments:{template:id}});
    });
  }
  it("honours hidden sections and never adds owner facts", () => {
    const document=applyTemplatePresentation(DEFAULT_SITE_DOCUMENT,"rose-studio");
    document.content={...document.content,visibility:{...document.content.visibility,about:false}};
    const markup=renderToStaticMarkup(<CollectionSections document={document} editing/>);
    expect(markup).not.toContain('id="about"');
  });
  it("guides portrait upload to real controls without claiming to upload", () => {
    const plan=planLocalAssistant("Upload my profile photo");
    expect(plan?.calls[0]).toEqual({name:"navigate_to",arguments:{destination:"about"}});
    expect(plan?.reply).toContain("select a file");
  });
});
