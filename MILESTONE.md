# Milestone 13 — Reusable templates and scene architecture

## V13 completed capability

- Added three section-aware presentation contracts: Cinematic Orbit, Architectural Grid and Editorial Depth.
- Template switching changes only approved presentation tokens and never replaces identity, About, experience, education, skills, projects, media, pages or posts.
- Added Constellation Field as a second reusable React Three Fiber scene family alongside Orbital Showcase.
- Added Studio controls and governed voice access for template selection, plus direct manual scene-family selection.
- Kept one active WebGL canvas per rendered portfolio, with the existing static fallback, mobile behavior and reduced-motion protection.
- Added compatible schema defaults so portfolios created before V13 open as Cinematic Orbit with Orbital Showcase.
- Rebuilt expanded Studio editing as a responsive desktop workspace with constrained reading width, two-column forms, larger headshot treatment, adaptive collections and a multi-column media gallery.
- Corrected Skills level option contrast across native dark select menus.
- Added automated coverage for legacy V13 upgrades, content-preserving template switching and governed voice template changes.

## V13 owner acceptance gate

- Expand the Content editor on desktop and confirm About media, forms, collections, pages, posts and Media Library use the adaptive desktop layout.
- Collapse the editor and confirm the original three-panel Studio returns without losing the selected section or draft changes.
- Switch through all three templates and confirm every content record, image and publication draft remains unchanged.
- Switch between Orbital Showcase and Constellation Field and verify skill selection works in both scenes.
- Test Skills levels 1–5 and confirm every option remains legible when open and selected.
- Check mobile layout, keyboard focus, reduced-motion mode and the static WebGL failure fallback.
- Publish each template once and confirm the Studio preview and immutable public portfolio use the same presentation contract.

## V12.4 deterministic preview routing and advanced content composition

- Corrected section navigation with scroll-container geometry instead of nested `offsetTop` values, eliminating the one-section-behind behavior shown in the supplied recording.
- Made the preview target the single source of truth for homepage sections, Site Pages and Blog Posts, preventing stale selections from reopening the wrong standalone preview.
- Switched standalone-to-homepage transitions to an immediate layout-phase route change so the Hero no longer flashes before the requested section appears.
- Added desktop drag-and-drop and touch/pen long-press block reordering, while retaining accessible move buttons as a keyboard-friendly fallback.
- Added an inline insertion control after every content block, allowing headings, paragraphs, quotes, bullet lists, numbered lists and images to be inserted in context.
- Preserved the page/article title as the single H1 and added explicit H2–H6 selection for structured heading blocks.
- Added visible SEO title and description guidance, live character counts, a canonical-path preview and a search-result preview.
- Extended cinematic depth across homepage sections and standalone public content with lightweight CSS layers while retaining the single Hero WebGL scene, reduced-motion behavior and mobile fallbacks.
- Extended voice block editing to understand H2–H6 choices without granting voice permission to upload files or publish content.
- Added regression coverage for nested preview geometry, inline insertion, direct block moves and semantic heading levels.

## V12.3 bounded Studio preview and navigation

- Converted the Studio live canvas into a viewport-bounded scroll container so section selection never scrolls the browser window away from the editor.
- Replaced viewport-level `scrollIntoView()` behavior with container-relative, reduced-motion-aware scrolling.
- Synchronized canvas navigation and the Editing selector in both directions across homepage sections, Site Page drafts and Blog Post drafts.
- Added working Hero calls to action inside the live preview for Projects and Contact.
- Added a draft-aware detailed About button in the homepage preview and a direct preview action in the About editor.
- Added an explicit return-to-homepage control for standalone Site Page and Blog draft previews.
- Preserved full-page Preview mode while keeping desktop editor, canvas and Voice Assistant panels independently scrollable.
- Added regression coverage for About, Education and standalone-page preview transitions.

## V12.2 publication and media stabilization

- Split inline rich-text rendering from the client-only editor so public Site Page and Blog routes render safely on the server.
- Restored cover images in the selected-item Studio preview and in immutable published pages/articles.
- Simplified heading blocks to a normal text field; formatting controls remain available for paragraphs, quotes and list items.
- Made image upload the first action: alternative text can be added before or edited after upload, while a safe filename-derived fallback prevents inaccessible blank output.
- Added clearer item-publication guidance and direct route explanations for the Blog index, Projects index and detailed Site Pages such as About.
- Added public navigation for every included Site Page, plus conditional Blog and Projects links.
- Added regression tests for server-safe inline formatting and upload-first alternative-text derivation.

## V12.1 usability completion

- Replaced the ambiguous Custom Pages/Page/Post switch with separate task-focused Site Pages and Blog Posts editors.
- Clarified that Site Pages are standalone long-form pages, while all articles are collected automatically on one Blog index.
- Added direct cover and content-image uploads at the point of use, with required alternative text and optional reuse of existing images.
- Added safe inline bold, italic, underline and `https://` hyperlink formatting plus bullet and numbered lists.
- Added live draft previews for the selected Site Page or Blog article and synchronized homepage-section preview scrolling.
- Added a dedicated public Projects index while limiting the published homepage to four featured project cards.
- Added a one-click detailed About page starter; a published Site Page with the `/about` slug is linked from the concise homepage About section.
- Added editor expansion, a hideable Voice Assistant, mouse-driven side-panel resizing and responsive Preview/Exit Preview controls.
- Updated voice definitions for Site Pages, Blog articles and numbered lists; image upload remains an explicit manual action.

## Completed

1. Every portfolio now has a backward-compatible publishing workspace for up to 12 custom pages and 24 blog posts.
2. Pages and posts begin as private drafts and require an explicit owner action before inclusion in the next site publication.
3. Each item has a collision-safe public slug, SEO title, SEO description, optional reusable cover image and publication timestamp.
4. Blog posts also support excerpts and up to eight tags; custom pages have owner-controlled navigation labels.
5. A bounded structured editor supports headings, paragraphs, quotes, lists and reusable media blocks without accepting arbitrary HTML or executable code.
6. Blocks can be added, edited, reordered and removed through the same typed command bus used by manual editing, undo, revision history and recovery.
7. Published custom pages render at `/p/[portfolio-slug]/pages/[page-slug]`.
8. Published blog indexes and articles render at `/p/[portfolio-slug]/blog` and `/p/[portfolio-slug]/blog/[post-slug]`.
9. Public routes read only the current immutable publication snapshot and return 404 for drafts, missing items or unpublished collections.
10. Portfolio navigation automatically includes published page labels and the Blog link when the snapshot contains published posts.
11. Voice tools may create and edit page/post drafts and text blocks but cannot publish, upload media, inject code or bypass validation.
12. Existing V11 documents receive empty page/post collections through schema defaults; no database migration is required.
13. V12-specific tests cover legacy upgrades, explicit publishing, structured content, numbered lists, semantic heading levels, direct reordering, unique slugs and voice publication boundaries.

## No new SQL migration

V12 stores page and blog data inside the validated project document and immutable publication snapshots. It reuses the existing owner-only project and revision policies plus the V10.1 media bucket policies.

## Owner acceptance gate

- Create one custom page and one blog post; confirm both remain absent from the public site while in Draft status.
- Add and reorder every block type, upload an image directly, edit its alternative text and reload Studio to verify persistence.
- Verify duplicate page/post slugs are rejected and invalid slugs are normalized safely.
- Publish each item in Studio, then publish the portfolio revision; confirm the new public routes and navigation links work in a private browser.
- Change a published article without republishing the portfolio and confirm the live snapshot remains unchanged.
- Return an item to Draft, publish the portfolio again and confirm its public route returns 404.
- Confirm article/page title, description and cover image appear in page metadata.
- Ask voice to draft and edit content, then confirm voice cannot publish it.
- Record any remaining corrections as V12.x; begin V13 only after this gate passes.
