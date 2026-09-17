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

  it("switches templates by voice without replacing content", async () => {
    let document: SiteDocument = DEFAULT_SITE_DOCUMENT;
    const originalProjects = structuredClone(document.content.projects);
    const execute = (command: SiteCommand) => { document = applySiteCommand(document, command); };
    const result = await runVoiceTool("set_portfolio_template", { template: "editorial-depth" }, execute, () => undefined);
    expect(result.ok).toBe(true);
    expect(document.design.template).toBe("editorial-depth");
    expect(document.content.projects).toEqual(originalProjects);
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

  it("can update factual case-study fields through the governed voice path", async () => {
    let document: SiteDocument = DEFAULT_SITE_DOCUMENT;
    const execute = (command: SiteCommand) => { document = applySiteCommand(document, command); };
    const id = document.content.projects[0].id;
    const result = await runVoiceTool("manage_project", { action: "update", item_id: id, role: "Product architect", challenge: "Unstructured portfolio editing", approach: "One typed command pipeline", outcome: "A revision-safe workflow" }, execute, () => undefined);
    expect(result.ok).toBe(true);
    expect(document.content.projects[0]).toMatchObject({ role: "Product architect", outcome: "A revision-safe workflow" });
  });

  it("can draft structured blog content but cannot publish it", async () => {
    let document: SiteDocument = DEFAULT_SITE_DOCUMENT;
    const execute = (command: SiteCommand) => { document = applySiteCommand(document, command); };
    await runVoiceTool("manage_page_or_post", { action: "add", kind: "post", title: "Practical AI systems" }, execute, () => undefined);
    const post = document.publishing.posts[0];
    await runVoiceTool("manage_content_block", { action: "add", kind: "post", item_id: post.id, block_type: "paragraph" }, execute, () => undefined);
    const block = document.publishing.posts[0].blocks[0];
    await runVoiceTool("manage_content_block", { action: "update", kind: "post", item_id: post.id, block_id: block.id, text: "A governed approach to useful AI." }, execute, () => undefined);
    expect(document.publishing.posts[0]).toMatchObject({ status: "draft", title: "Practical AI systems" });
    expect(document.publishing.posts[0].blocks[0].text).toBe("A governed approach to useful AI.");
    expect(await runVoiceTool("publishing.setStatus", {}, execute, () => undefined)).toEqual({ ok: false, error: "Unsupported tool: publishing.setStatus." });
  });
});
