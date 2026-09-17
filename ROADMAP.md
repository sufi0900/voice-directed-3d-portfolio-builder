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

## Remaining major milestones after V13: two

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

### V14 — Production readiness

Complete responsive QA, accessibility, performance budgets, SEO/OG/sitemap/robots, contact delivery, abuse controls, analytics and deployment configuration. Acceptance: cross-device, Lighthouse, keyboard, reduced-motion, security and failure-recovery gates pass.

### V15 — Final product and launch gate

Run end-to-end regression, threat review, data-retention review, onboarding usability tests, template compatibility tests, documentation, demo/submission assets and production deployment. Acceptance: all manual and automated release gates pass with no unresolved critical issues.

## Architecture rationale

The current work is intentionally reusable infrastructure. The validated document is the content contract; commands are the mutation contract; revisions are the recovery contract; publication snapshots are the delivery contract; templates and scenes are renderers. V13 extends these contracts rather than rebuilding the application. New layouts and scenes must use the same validation, ownership, revision, restoration and publishing boundaries already proven by the foundation.
