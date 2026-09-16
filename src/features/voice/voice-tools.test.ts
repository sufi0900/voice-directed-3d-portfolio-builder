import { describe, expect, it } from "vitest";
import { applySiteCommand, type SiteCommand } from "@/domain/commands";
import { DEFAULT_SITE_DOCUMENT, type SiteDocument } from "@/domain/site-document";
import { runVoiceTool } from "./voice-tools";

describe("voice tools", () => {
  it("routes an approved theme request through site commands", async () => {
    let document: SiteDocument = DEFAULT_SITE_DOCUMENT;
    const execute = (command: SiteCommand) => { document = applySiteCommand(document, command); };
    const result = await runVoiceTool("set_color_theme", { accent: "coral", background: "ink" }, execute, () => undefined);
    expect(result.ok).toBe(true);
    expect(document.design).toMatchObject({ accent: "coral", background: "ink" });
    expect(document.revision).toBe(2);
  });

  it("rejects a voice value outside approved tokens", async () => {
    let document: SiteDocument = DEFAULT_SITE_DOCUMENT;
    const execute = (command: SiteCommand) => { document = applySiteCommand(document, command); };
    const result = await runVoiceTool("set_color_theme", { accent: "brand-new-red" }, execute, () => undefined);
    expect(result.ok).toBe(false);
    expect(document).toEqual(DEFAULT_SITE_DOCUMENT);
  });

  it("does not expose a publish tool", async () => {
    const result = await runVoiceTool("publish_site", {}, () => undefined, () => undefined);
    expect(result).toEqual({ ok: false, error: "Unsupported tool: publish_site." });
  });

  it("refines raw About copy before applying the governed command", async () => {
    let document: SiteDocument = DEFAULT_SITE_DOCUMENT;
    const execute = (command: SiteCommand) => { document = applySiteCommand(document, command); };
    const result = await runVoiceTool("update_text_content", { target: "about_body", text: "raw facts", polish: true }, execute, () => undefined, async () => "Polished facts without additions.");
    expect(result.ok).toBe(true);
    expect(document.content.about.body).toBe("Polished facts without additions.");
  });

  it("can add education, experience, projects and skills by voice", async () => {
    let document: SiteDocument = DEFAULT_SITE_DOCUMENT;
    const execute = (command: SiteCommand) => { document = applySiteCommand(document, command); };
    await runVoiceTool("manage_education", { action: "add", credential: "MCS", institution: "AWKUM" }, execute, () => undefined);
    await runVoiceTool("manage_experience", { action: "add", role: "SEO Specialist", organization: "Example" }, execute, () => undefined);
    await runVoiceTool("manage_project", { action: "add", title: "Search Platform", technologies: ["Next.js"] }, execute, () => undefined);
    await runVoiceTool("manage_skill", { action: "add", label: "Accessibility", level: 4 }, execute, () => undefined);
    expect(document.content.education.at(-1)?.credential).toBe("MCS");
    expect(document.content.experience.at(-1)?.role).toBe("SEO Specialist");
    expect(document.content.projects.at(-1)?.title).toBe("Search Platform");
    expect(document.skills.at(-1)?.label).toBe("Accessibility");
  });
});
