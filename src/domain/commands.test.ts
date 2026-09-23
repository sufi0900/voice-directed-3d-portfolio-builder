import { describe, expect, it } from "vitest";
import { applySiteCommand } from "./commands";
import { DEFAULT_SITE_DOCUMENT, validateSiteDocument } from "./site-document";
import { initialStudioState, studioReducer } from "@/features/studio/studio-reducer";

describe("site command bus", () => {
  it("applies a valid design command and increments the revision", () => {
    const result = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "design.setAccent", value: "violet" });
    expect(result.design.accent).toBe("violet");
    expect(result.revision).toBe(1);
  });

  it("rejects values outside the design system", () => {
    expect(() => applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "design.setAccent", value: "random-orange" })).toThrow();
  });

  it("switches reusable templates without changing portfolio content", () => {
    const contentBefore = structuredClone(DEFAULT_SITE_DOCUMENT.content);
    const identityBefore = structuredClone(DEFAULT_SITE_DOCUMENT.identity);
    const switched = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "design.setTemplate", value: "architectural-grid" });
    expect(switched.design.template).toBe("architectural-grid");
    expect(switched.scene.family).toBe("constellation-field");
    expect(switched.content).toEqual(contentBefore);
    expect(switched.identity).toEqual(identityBefore);
    expect(switched.revision).toBe(1);
  });

  it("applies the non-orbital kinetic gallery through the same governed command", () => {
    const contentBefore = structuredClone(DEFAULT_SITE_DOCUMENT.content);
    const switched = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "design.setTemplate", value: "kinetic-gallery" });
    expect(switched.scene.family).toBe("kinetic-gallery");
    expect(switched.content).toEqual(contentBefore);
    expect(switched.revision).toBe(1);
  });

  it("applies Velocity Atelier as a bright automotive presentation without content loss", () => {
    const identityBefore = structuredClone(DEFAULT_SITE_DOCUMENT.identity);
    const projectsBefore = structuredClone(DEFAULT_SITE_DOCUMENT.content.projects);
    const switched = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "design.setTemplate", value: "velocity-atelier" });
    expect(switched.scene.family).toBe("velocity-roadster");
    expect(switched.design.background).toBe("ink");
    expect(switched.scene.focusedSkill).toBeNull();
    expect(switched.identity).toEqual(identityBefore);
    expect(switched.content.projects).toEqual(projectsBefore);
  });

  it("upgrades pre-V13 presentation data with compatible defaults", () => {
    const legacy = structuredClone(DEFAULT_SITE_DOCUMENT) as unknown as { design: Record<string, unknown>; scene: Record<string, unknown> };
    delete legacy.design.template;
    delete legacy.scene.family;
    const upgraded = validateSiteDocument(legacy);
    expect(upgraded.design.template).toBe("cinematic-orbit");
    expect(upgraded.scene.family).toBe("orbital-showcase");
  });

  it("uses the same reversible reducer path for voice commands", () => {
    const changed = studioReducer(initialStudioState, {
      type: "execute", source: "voice", command: { type: "scene.setPreset", value: "architect" },
    });
    const undone = studioReducer(changed, { type: "undo", source: "voice" });
    expect(changed.present.scene.preset).toBe("architect");
    expect(undone.present.scene.preset).toBe("cosmic");
  });

  it("contains invalid assistant output instead of crashing the Studio", () => {
    const state = studioReducer(initialStudioState, {
      type: "execute", source: "voice", command: { type: "identity.set", field: "role", value: "x".repeat(81) },
    });
    expect(state.present).toBe(initialStudioState.present);
    expect(state.lastCommandError).toContain("maximum 80 characters");
    expect(state.past).toEqual([]);
  });

  it("refuses to focus a missing skill", () => {
    expect(() => applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "scene.focusSkill", skillId: "missing" })).toThrow();
  });

  it("does not create a revision for an unchanged buffered text commit", () => {
    const result = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "identity.set", field: "name", value: `  ${DEFAULT_SITE_DOCUMENT.identity.name}  ` });
    expect(result).toBe(DEFAULT_SITE_DOCUMENT);
    expect(result.revision).toBe(0);
  });

  it("adds, edits and removes featured skills through validated commands", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "skill.add", label: "Accessibility" });
    const skill = added.skills.find((item) => item.label === "Accessibility");
    expect(skill).toBeDefined();
    const updated = applySiteCommand(added, { type: "skill.update", skillId: skill!.id, label: "Inclusive UX", level: 5 });
    expect(updated.skills.find((item) => item.id === skill!.id)).toMatchObject({ label: "Inclusive UX", level: 5 });
    const removed = applySiteCommand(updated, { type: "skill.remove", skillId: skill!.id });
    expect(removed.skills.some((item) => item.id === skill!.id)).toBe(false);
  });

  it("upgrades legacy hero documents with the V9 section model", () => {
    const legacy = structuredClone(DEFAULT_SITE_DOCUMENT) as unknown as Record<string, unknown>;
    delete legacy.content;
    delete legacy.media;
    const upgraded = validateSiteDocument(legacy);
    expect(upgraded.content.order).toEqual(["about", "experience", "skills", "projects", "contact"]);
    expect(upgraded.content.visibility.projects).toBe(true);
    expect(upgraded.content.education).toEqual([]);
    expect(upgraded.media).toEqual({ headshotUrl: "", headshotAlt: "", assets: [] });
  });

  it("edits and reorders full portfolio sections through validated commands", () => {
    const edited = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "content.setAbout", field: "body", value: "A focused professional overview." });
    const moved = applySiteCommand(edited, { type: "section.move", section: "projects", direction: "up" });
    const hidden = applySiteCommand(moved, { type: "section.setVisible", section: "experience", value: false });
    expect(edited.content.about.body).toBe("A focused professional overview.");
    expect(moved.content.order.indexOf("projects")).toBeLessThan(moved.content.order.indexOf("skills"));
    expect(hidden.content.visibility.experience).toBe(false);
  });

  it("adds, edits and removes experience and project records", () => {
    const withExperience = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "experience.add" });
    const experience = withExperience.content.experience.at(-1)!;
    const editedExperience = applySiteCommand(withExperience, { type: "experience.update", itemId: experience.id, field: "role", value: "Product Engineer" });
    expect(editedExperience.content.experience.at(-1)?.role).toBe("Product Engineer");
    const withProject = applySiteCommand(editedExperience, { type: "project.add" });
    const project = withProject.content.projects.at(-1)!;
    const editedProject = applySiteCommand(withProject, { type: "project.update", itemId: project.id, field: "technologies", value: ["Next.js", "Supabase"] });
    expect(editedProject.content.projects.at(-1)?.technologies).toEqual(["Next.js", "Supabase"]);
    const removed = applySiteCommand(editedProject, { type: "project.remove", itemId: project.id });
    expect(removed.content.projects.some((item) => item.id === project.id)).toBe(false);
  });

  it("adds education and updates governed profile media", () => {
    const educated = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "education.add", credential: "MCS", institution: "AWKUM", period: "Completed" });
    const withImage = applySiteCommand(educated, { type: "media.setHeadshot", url: "https://example.com/headshot.webp", alt: "Sufian Mustafa headshot" });
    expect(educated.content.education.at(-1)).toMatchObject({ credential: "MCS", institution: "AWKUM" });
    expect(withImage.media.headshotUrl).toBe("https://example.com/headshot.webp");
  });

  it("builds an ordered case study and reuses governed media", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "project.add", title: "Search Growth System" });
    const project = added.content.projects.at(-1)!;
    expect(project.caseStudySlug).toBe("search-growth-system");
    const detailed = applySiteCommand(added, { type: "project.update", itemId: project.id, field: "outcome", value: "A clearer, measurable publishing workflow." });
    const withAsset = applySiteCommand(detailed, { type: "media.addAsset", asset: { id: "asset-1", url: "https://example.com/result.webp", storagePath: "owner/project/library/result.webp", alt: "Search performance dashboard", createdAt: new Date(0).toISOString() } });
    const attached = applySiteCommand(withAsset, { type: "project.attachMedia", itemId: project.id, mediaId: "asset-1" });
    expect(attached.content.projects.at(-1)?.mediaIds).toEqual(["asset-1"]);
    const removed = applySiteCommand(attached, { type: "media.removeAsset", mediaId: "asset-1" });
    expect(removed.media.assets).toEqual([]);
    expect(removed.content.projects.at(-1)?.mediaIds).toEqual([]);
  });

  it("prevents duplicate public case-study slugs", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "project.add", title: "Second project" });
    const project = added.content.projects.at(-1)!;
    expect(() => applySiteCommand(added, { type: "project.update", itemId: project.id, field: "caseStudySlug", value: "voxfolio" })).toThrow("unique slug");
  });

  it("upgrades legacy documents with an empty V12 publishing workspace", () => {
    const legacy = structuredClone(DEFAULT_SITE_DOCUMENT) as unknown as Record<string, unknown>;
    delete legacy.publishing;
    const upgraded = validateSiteDocument(legacy);
    expect(upgraded.publishing).toEqual({ pages: [], posts: [] });
  });

  it("upgrades an earlier document to a canonical opportunity safely", () => {
    const legacy = structuredClone(DEFAULT_SITE_DOCUMENT) as unknown as Record<string, unknown>;
    delete legacy.opportunity;
    expect(validateSiteDocument(legacy).opportunity).toMatchObject({ status: "canonical", canonicalProjectId: null });
  });

  it("keeps opportunity-variant decisions in the validated command pipeline", () => {
    const variant = validateSiteDocument({ ...DEFAULT_SITE_DOCUMENT, projectId: "63531bc7-6833-4e22-981f-08e97a9731f9", opportunity: { status: "draft", canonicalProjectId: "ae2655b1-7a26-4dfe-a1ea-2e1945963ed5", sourceRevision: 12, title: "AI builder role", brief: "Emphasise approved product-system evidence.", audience: "Hiring team", visibility: "private", includedProjectIds: [], approvalNotes: "" } });
    const selected = applySiteCommand(variant, { type: "opportunity.setIncludedProjects", projectIds: [variant.content.projects[0].id] });
    const reviewed = applySiteCommand(selected, { type: "opportunity.setStatus", status: "review" });
    expect(reviewed.opportunity).toMatchObject({ status: "review", includedProjectIds: [variant.content.projects[0].id] });
    expect(() => applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "opportunity.set", field: "brief", value: "Do not change the source." })).toThrow("Create an opportunity variant");
  });

  it("creates a structured page draft and requires content before publishing", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "page", title: "Services" });
    const page = added.publishing.pages[0];
    expect(page).toMatchObject({ title: "Services", slug: "services", status: "draft" });
    expect(() => applySiteCommand(added, { type: "publishing.setStatus", kind: "page", itemId: page.id, status: "published" })).toThrow("meaningful page content");
    const withBlock = applySiteCommand(added, { type: "block.add", kind: "page", itemId: page.id, blockType: "paragraph" });
    const block = withBlock.publishing.pages[0].blocks[0];
    const written = applySiteCommand(withBlock, { type: "block.update", kind: "page", itemId: page.id, blockId: block.id, field: "text", value: "A focused portfolio service." });
    const published = applySiteCommand(written, { type: "publishing.setStatus", kind: "page", itemId: page.id, status: "published" });
    expect(published.publishing.pages[0].status).toBe("published");
    expect(published.publishing.pages[0].publishedAt).not.toBeNull();
  });

  it("keeps page and post slugs unique within their public routes", () => {
    const first = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "post", title: "Design systems" });
    const second = applySiteCommand(first, { type: "publishing.add", kind: "post", title: "Second article" });
    expect(() => applySiteCommand(second, { type: "publishing.update", kind: "post", itemId: second.publishing.posts[1].id, field: "slug", value: "design-systems" })).toThrow("unique slug");
  });

  it("supports numbered-list blocks through the governed content model", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "post", title: "A repeatable workflow" });
    const post = added.publishing.posts[0];
    const withList = applySiteCommand(added, { type: "block.add", kind: "post", itemId: post.id, blockType: "ordered-list" });
    const block = withList.publishing.posts[0].blocks[0];
    const updated = applySiteCommand(withList, { type: "block.update", kind: "post", itemId: post.id, blockId: block.id, field: "items", value: ["Research", "Draft", "Review"] });
    expect(updated.publishing.posts[0].blocks[0]).toMatchObject({ type: "ordered-list", items: ["Research", "Draft", "Review"] });
  });

  it("inserts blocks at an inline position and supports direct drag reordering", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "page", title: "About" });
    const page = added.publishing.pages[0];
    const first = applySiteCommand(added, { type: "block.add", kind: "page", itemId: page.id, blockType: "heading" });
    const heading = first.publishing.pages[0].blocks[0];
    const second = applySiteCommand(first, { type: "block.add", kind: "page", itemId: page.id, blockType: "paragraph", afterBlockId: heading.id });
    const paragraph = second.publishing.pages[0].blocks[1];
    const third = applySiteCommand(second, { type: "block.add", kind: "page", itemId: page.id, blockType: "quote", afterBlockId: heading.id });
    expect(third.publishing.pages[0].blocks.map((block) => block.type)).toEqual(["heading", "quote", "paragraph"]);
    const moved = applySiteCommand(third, { type: "block.moveTo", kind: "page", itemId: page.id, blockId: paragraph.id, targetIndex: 0 });
    expect(moved.publishing.pages[0].blocks.map((block) => block.type)).toEqual(["paragraph", "heading", "quote"]);
  });

  it("supports an H2 through H6 hierarchy below the page-title H1", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "post", title: "Heading hierarchy" });
    const post = added.publishing.posts[0];
    const withHeading = applySiteCommand(added, { type: "block.add", kind: "post", itemId: post.id, blockType: "heading" });
    const heading = withHeading.publishing.posts[0].blocks[0];
    const updated = applySiteCommand(withHeading, { type: "block.update", kind: "post", itemId: post.id, blockId: heading.id, field: "headingLevel", value: "h4" });
    expect(updated.publishing.posts[0].blocks[0].headingLevel).toBe("h4");
  });

  it("reorders homepage sections to an exact drag target", () => {
    const moved = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "section.moveTo", section: "contact", targetIndex: 1 });
    expect(moved.content.order).toEqual(["about", "contact", "experience", "skills", "projects"]);
    expect(moved.revision).toBe(DEFAULT_SITE_DOCUMENT.revision + 1);
  });

  it("requires complete article metadata and content before publishing", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "publishing.add", kind: "post", title: "Release notes" });
    const post = added.publishing.posts[0];
    expect(() => applySiteCommand(added, { type: "publishing.setStatus", kind: "post", itemId: post.id, status: "published" })).toThrow("meaningful page content");
    const withBlock = applySiteCommand(added, { type: "block.add", kind: "post", itemId: post.id, blockType: "paragraph" });
    const block = withBlock.publishing.posts[0].blocks[0];
    const written = applySiteCommand(withBlock, { type: "block.update", kind: "post", itemId: post.id, blockId: block.id, field: "text", value: "A complete article." });
    expect(() => applySiteCommand(written, { type: "publishing.setStatus", kind: "post", itemId: post.id, status: "published" })).toThrow("excerpt");
  });

  it("adds, updates and removes governed Contact social links", () => {
    const added = applySiteCommand(DEFAULT_SITE_DOCUMENT, { type: "social.add", platform: "linkedin", url: "https://linkedin.com/in/example" });
    const social = added.content.contact.socials[0];
    expect(social.platform).toBe("linkedin");
    const updated = applySiteCommand(added, { type: "social.update", itemId: social.id, platform: "website", url: "https://example.com" });
    expect(updated.content.contact.socials[0]).toMatchObject({ platform: "website", url: "https://example.com" });
    expect(applySiteCommand(updated, { type: "social.remove", itemId: social.id }).content.contact.socials).toEqual([]);
  });
});
