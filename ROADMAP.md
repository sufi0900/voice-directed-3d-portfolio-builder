# Voxfolio implementation roadmap

## Versioning rule

Major versions introduce a completed product capability. Corrections, UX completion, refactoring and owner-acceptance fixes remain sub-versions of that milestone (for example, 8.1 and 8.2). A new major version starts only after the previous acceptance gate passes.

## Current position

- V1–V8 established the governed foundation: typed document commands, 3D scene controls, voice operation, authentication, server persistence, CV grounding, design interview, immutable publishing and revision recovery.
- V8.1 completes the user lifecycle around that foundation: guest draft → authentication → cloud project → Studio → publication, session-aware homepage navigation, publication-aware project cards and application identity.
- V8.2 closes owner-acceptance navigation defects: authenticated Studio identity is preserved and My Projects provides a direct Home path.
- V9 implements the full portfolio document foundation: About, Experience, Skills, Projects and Contact now share the validated command, revision, recovery and publication pipeline.
- V10 completes governed voice access across the document, adds fact-preserving AI copy refinement, education onboarding, owner headshots, dynamic favicons and public identity navigation.
- V11 completes evidence-rich project case studies, reusable media, galleries, ordering and immutable public detail routes.
- V12 completes governed custom pages and blog publishing with private drafts, structured blocks, SEO metadata and immutable public routes.
- V13 completes content-preserving reusable templates, a second scene family and a responsive expanded desktop editing workspace.
- V14 completes Studio workspace isolation, exact structure ordering, template previews and the first production SEO, security and performance release gates.
- V15 completes direct governed article publishing, Blog discovery, Contact social profiles and the final launch acceptance gate.
- V19 completes synchronized voice/text agent operation: explicit Studio navigation, edit-following canvas focus, Gemini intent planning, paste-friendly chat, transcript auto-follow and optional audio feedback.
- V20 establishes the opportunity-variant contract: canonical evidence can be tailored into independent, reviewable projects with their own revisions and public delivery, without silently changing the source.

## V19 — Synchronized Gemini voice/text agent (implemented; owner acceptance pending)

Vox now treats navigation as a governed first-class tool. Spoken or typed requests can open Hero, About, Experience, Education, Skills, Projects, Contact, Site Pages, Blog, Page Structure, Media Library, Design or 3D Scene. Every successful edit returns a UI target so the matching editor and bounded Live Canvas move together. Gemini performs server-side intent planning and fact-preserving copy refinement; the existing OpenAI refinement path remains an optional recovery provider. Typed chat supports pasted URLs and multi-turn clarification, the transcript follows the latest message, and short muteable sound cues communicate activation, speech, processing and completion.

Acceptance: verify navigation and edit-following for every homepage section and one existing page/post; refine Hero and About copy without introducing facts; add a social URL through a text follow-up; confirm unauthenticated AI requests are rejected; confirm voice/text cannot publish, upload media, delete a project or bypass the typed command schema; and verify sound mute plus reduced-motion behavior.

## V18 — Velocity Atelier automotive presentation (implemented; owner acceptance pending)

Adds Velocity Atelier, a fifth presentation contract that changes the subject, composition, lighting and motion language. A recognizable roadster occupies a bright architectural automotive studio while portfolio identity appears in a low editorial showroom card. Skills remain in normal content sections instead of being pinned to the 3D object. Wheel rotation, roadway flow, suspension and pointer response provide cinematic movement without orbit controls.

Acceptance: Studio and public output share the bright automotive layout; template and voice selection preserve all content; reduced motion holds vehicle and road motion; and the static WebGL fallback remains recognizable and accessible.

## V16 — Kinetic Gallery presentation system (implemented; owner acceptance pending)

Adds a fourth content-preserving template for visual storytellers: Kinetic Gallery. It replaces orbit-driven visual language with a cinematic, pointer-responsive gallery of suspended capability panels and a central luminous monolith. It remains a presentation contract: the same validated document, commands, revisions, publication snapshots, media, pages, posts, accessibility and owner boundaries apply unchanged.

Acceptance: template selection, voice selection, Studio preview and immutable public output all render the gallery scene; switching to or from it preserves every portfolio content field; reduced-motion and WebGL fallback remain usable.

## V20 — Opportunity variants (implemented; owner acceptance pending)

The first commercial workflow is now a controlled content derivative: canonical portfolio → opportunity brief → separate variant → selective evidence → review → independent publication. The V20 code deliberately stops before autonomous matching, unreviewed source refreshes, CRM or generic website-builder features.

Acceptance: create a variant from My projects; prove the canonical project is unchanged; select only allowed work; edit/navigate by voice; publish a separate immutable URL; and run the V20 manual checks.

## Next product phases (architecture locked; not safe to mark implemented without provider credentials and owner validation)

- **V20.1 — Opportunity planning and review diff:** translate a spoken/text brief into a constrained plan, compare canonical vs variant field-by-field, and accept/reject individual proposed changes.
- **V20.2 — Evidence-aware assistant:** allow the agent to select from approved facts, warn about missing evidence and never create unsupported claims.
- **V20.3 — Public delivery hardening (implemented; owner acceptance pending):** dynamic public sitemap, portfolio social image, revocable Shared links pinned to immutable publications and coarse, privacy-first share-open counts. Broader case/article structured-data and evaluation analytics remain for a future release, not claimed complete here.
- **V21 — Configurable professional agent (implemented; owner acceptance pending):** server-side Nebius or OpenRouter model selection with Gemini/OpenAI fallback, owner-approved durable professional facts, sequential typed and voice tool execution, and private metadata-only evaluation counts. Live voice remains AssemblyAI. Actual Nebius/OpenRouter interoperability requires the owner's configured key and model ID; it has not been simulated as live validation.

## Earlier milestone history

### V9 — Full portfolio document model (implemented)

Expand `SiteDocument` from a hero-led prototype into a complete portfolio structure: Hero, About, Experience, Skills, Projects, Contact, navigation and section visibility/order. Add schema migration/adapters so existing projects remain valid. Acceptance: every section is editable, saved, revisioned, restorable and publishable through the existing command pipeline.

### V10 — Voice-complete editing and profile media (implemented; owner acceptance pending)

Give the governed voice layer parity with manual section controls, refine user-supplied narrative copy without inventing facts, capture optional skills and education at creation, and add safe owner headshots that drive About layouts and favicons. Acceptance: all content types remain validated, undoable, revisioned and publish-safe.

### V11 — Project case studies and media library (implemented; owner acceptance pending)

Add expanded case-study records, outcomes, galleries, safe reusable media assets, ordering and project-detail routes. Acceptance: users can build evidence-rich case studies without losing provenance or breaking templates.

### V12 — Custom pages and blog system (implemented; owner acceptance pending)

Add user-created blog posts and flexible content pages with drafts, slugs, metadata, structured blocks, publication status and public routes. This is a lightweight portfolio publishing system—not an unrestricted website-code generator. Acceptance: blog/page content has owner-only drafts, explicit publishing and SEO metadata.

### V13 — Template and scene architecture (implemented; owner acceptance pending)

Converted layouts into section-aware reusable template contracts, added Constellation Field as the second reusable 3D scene family, and shipped three complete presentation variants. Content and presentation are separate, and automated tests verify that template switching preserves portfolio content. Acceptance: owner cross-device review confirms every template remains accessible and responsive.

### V14 — Production readiness (implemented; owner acceptance pending)

Complete responsive QA, accessibility, performance budgets, SEO/OG/sitemap/robots, contact delivery, abuse controls, analytics and deployment configuration. Acceptance: cross-device, Lighthouse, keyboard, reduced-motion, security and failure-recovery gates pass.

### V15 — Final product and launch gate (implemented; owner acceptance pending)

Run end-to-end regression, threat review, data-retention review, onboarding usability tests, template compatibility tests, documentation, demo/submission assets and production deployment. Acceptance: all manual and automated release gates pass with no unresolved critical issues.

## Architecture rationale

The current work is intentionally reusable infrastructure. The validated document is the content contract; commands are the mutation contract; revisions are the recovery contract; publication snapshots are the delivery contract; templates and scenes are renderers. V13 extends these contracts rather than rebuilding the application. New layouts and scenes must use the same validation, ownership, revision, restoration and publishing boundaries already proven by the foundation.
# Incremental delivery status

- **V20.0 complete:** isolated opportunity-variant creation, lineage, presentation filtering, voice/text navigation, and migration `006_opportunity_variants.sql`.
- **V20.1 complete:** source snapshot, review checklist, source-difference display, and readiness gate.
- **V20.2 implemented (owner acceptance pending):** evidence-aware Gemini/local planning, individually approved suggestions, source warnings, independent variant creation helper repair and a publication privacy migration (`007`).
- **V20.3 implemented (owner acceptance pending):** expiring/revocable hashed private share tokens, private nested-page rendering, share-open counts, owner controls, public sitemap and OG image. Apply migrations `007` then `008` before deployment; test live RLS and external crawlers manually.
- **V21 implemented (owner acceptance pending):** provider gateway, owner-scoped approved facts, bounded sequential tool execution, and private evaluation counts. Apply migration `009` and validate configured provider credentials with a real account.
- **V22 implemented (owner acceptance pending):** agent activity collection is opt-in per canonical portfolio and variants; owners can disable collection and clear each project's existing activity metadata. Apply migration `010` after `009`, then validate live RLS and cross-variant settings.
- **V23 implemented (owner acceptance pending):** an owner can compare canonical profile and case-study values with an independent opportunity variant, selectively import approved changes, and preserve source/variant revisions atomically. Apply migration `011`; verify live RLS, linked media and unchanged published snapshots.
- **V24 planned:** opportunity delivery and recipient feedback with explicit owner consent and privacy boundaries; exact scope must be confirmed by acceptance of V23.
- **V25 planned:** complete live voice-to-opportunity acceptance, cross-device and access-control verification, and release remediation as V25.x.
