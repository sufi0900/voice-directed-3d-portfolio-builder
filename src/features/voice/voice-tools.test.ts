import { describe, expect, it } from "vitest";
import { applySiteCommand, type SiteCommand } from "@/domain/commands";
import { DEFAULT_SITE_DOCUMENT, type SiteDocument } from "@/domain/site-document";
import { runVoiceTool } from "./voice-tools";

describe("voice tools", () => {
  it("routes an approved theme request through site commands", () => {
    let document: SiteDocument = DEFAULT_SITE_DOCUMENT;
    const execute = (command: SiteCommand) => { document = applySiteCommand(document, command); };
    const result = runVoiceTool("set_color_theme", { accent: "coral", background: "ink" }, execute, () => undefined);
    expect(result.ok).toBe(true);
    expect(document.design).toMatchObject({ accent: "coral", background: "ink" });
    expect(document.revision).toBe(2);
  });

  it("rejects a voice value outside approved tokens", () => {
    let document: SiteDocument = DEFAULT_SITE_DOCUMENT;
    const execute = (command: SiteCommand) => { document = applySiteCommand(document, command); };
    const result = runVoiceTool("set_color_theme", { accent: "brand-new-red" }, execute, () => undefined);
    expect(result.ok).toBe(false);
    expect(document).toEqual(DEFAULT_SITE_DOCUMENT);
  });

  it("does not expose a publish tool", () => {
    const result = runVoiceTool("publish_site", {}, () => undefined, () => undefined);
    expect(result).toEqual({ ok: false, error: "Unsupported tool: publish_site." });
  });
});
