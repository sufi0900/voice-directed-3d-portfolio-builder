# Voxfolio V20 — Opportunity Variant Foundation

## Product outcome

Voxfolio now supports the core commercial workflow: one canonical, evidence-led
portfolio can produce separate opportunity versions for a role, client,
collaboration, accelerator or demo without silently rewriting the source.

## What is included

- owner-only creation of an isolated opportunity project from **My projects**
- source-project and source-revision traceability
- a structured opportunity brief, audience, review state, visibility and owner
  approval notes
- project-level evidence selection; only selected case studies render in a
  variant's homepage and public project index/detail routes
- independent revisions, undo, publishing, public URL and immutable release
  snapshots for every variant
- Studio controls and voice/text navigation for the opportunity workspace
- voice tools that can update an existing variant but cannot mutate a canonical
  portfolio, create nested variants, upload assets or publish
- public metadata canonical URLs, `Person` JSON-LD and non-indexing metadata
  for non-public variants
- schema migration and command-level tests for legacy-document compatibility

## Required database step

Run `supabase/migrations/006_opportunity_variants.sql` after migrations
001–005 and before deploying this release. It adds nullable project lineage
fields and an owner-scoped RPC that creates revision-zero variants atomically.

## Operating rules

1. Canonical portfolios remain the source of approved evidence.
2. A variant is a separate project; there is no automatic sync back to source.
3. A later source refresh must be an explicit, reviewable operation. V20 does
   not silently import source edits into variants.
4. Publication remains an owner action and snapshots the complete variant.
5. `private` and `shared` variants are marked `noindex`; use a private,
   unguessable public slug until signed sharing is introduced.

## Manual acceptance checks

1. Publish a canonical portfolio, then use **My projects → Create opportunity**.
2. Confirm the created Studio has a new project id, revision 0 and an
   Opportunity editor with the source revision recorded.
3. De-select one case study and confirm it disappears from the variant's live
   homepage, projects page and direct case-study URL, while it remains on the
   canonical site.
4. Edit the variant's brief with voice or text. Confirm its Studio and Live
   Canvas focus the Opportunity workspace and the canonical project is not
   modified.
5. Publish the variant under a different slug. Confirm the public page has the
   correct canonical metadata and non-public variants receive `noindex`.
