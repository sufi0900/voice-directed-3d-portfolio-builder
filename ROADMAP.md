# Voxfolio implementation roadmap

## Versioning rule

Major versions introduce a completed product capability. Corrections, UX completion, refactoring and owner-acceptance fixes remain sub-versions of that milestone (for example, 8.1 and 8.2). A new major version starts only after the previous acceptance gate passes.

## Current position

- V1–V8 established the governed foundation: typed document commands, 3D scene controls, voice operation, authentication, server persistence, CV grounding, design interview, immutable publishing and revision recovery.
- V8.1 completes the user lifecycle around that foundation: guest draft → authentication → cloud project → Studio → publication, session-aware homepage navigation, publication-aware project cards and application identity.
- V8.2 is reserved only for defects found during owner acceptance. It is not automatically scheduled.

## Remaining major milestones: seven

### V9 — Full portfolio document model

Expand `SiteDocument` from a hero-led prototype into a complete portfolio structure: Hero, About, Experience, Skills, Projects, Contact, navigation and section visibility/order. Add schema migration/adapters so existing projects remain valid. Acceptance: every section is editable, saved, revisioned, restorable and publishable through the existing command pipeline.

### V10 — Project case studies and media

Add repeatable project/case-study records, outcomes, technology tags, external links, image assets, safe uploads and project-detail presentation. Acceptance: users can add, reorder, edit and remove projects without losing provenance or breaking old templates.

### V11 — Custom pages and blog system

Add user-created blog posts and flexible content pages with drafts, slugs, metadata, structured blocks, publication status and public routes. This is a lightweight portfolio publishing system—not an unrestricted website-code generator. Acceptance: blog/page content has owner-only drafts, explicit publishing and SEO metadata.

### V12 — Template and scene architecture

Convert layouts into section-aware reusable template contracts; add the second reusable 3D scene family and additional complete templates. Separate content from presentation so one portfolio can switch templates safely. Acceptance: template switching preserves content and accessibility.

### V13 — Site-wide AI and voice workflows

Extend governed manual/voice commands across sections, projects and content. Add previewable multi-step operations, confirmation for high-impact changes and clear recovery receipts. Acceptance: AI cannot invent professional facts, publish, delete or replace evidence without explicit owner action.

### V14 — Production readiness

Complete responsive QA, accessibility, performance budgets, SEO/OG/sitemap/robots, contact delivery, abuse controls, analytics and deployment configuration. Acceptance: cross-device, Lighthouse, keyboard, reduced-motion, security and failure-recovery gates pass.

### V15 — Final product and launch gate

Run end-to-end regression, threat review, data-retention review, onboarding usability tests, template compatibility tests, documentation, demo/submission assets and production deployment. Acceptance: all manual and automated release gates pass with no unresolved critical issues.

## Architecture rationale

The current work is intentionally reusable infrastructure. The validated document is the content contract; commands are the mutation contract; revisions are the recovery contract; publication snapshots are the delivery contract; templates and scenes are renderers. V9–V13 extend these contracts rather than rebuilding the application. New sections and templates must use the same validation, ownership, revision, restoration and publishing boundaries already proven by the hero foundation.
