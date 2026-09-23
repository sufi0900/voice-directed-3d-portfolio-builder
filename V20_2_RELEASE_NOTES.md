# Voxfolio V20.2 — Evidence-aware opportunity proposals

Built from the user-supplied OpenCode RAR, not the older V20.1 copy.

## What OpenCode had completed

- Added a thoughtful implementation audit and expanded opportunity fields/schema.
- Added a variant creation/refresh helper and nine tests, but the helper was not wired into variant creation; its audit reported six failed tests.
- Did not implement the V20.2 evidence planner, approval UI, AI route, or V20.3 private sharing/analytics.

## Completed in this release

- Repaired and integrated the variant helper into the owner-scoped creation route, preserving independent project identity, source snapshot, pages/posts, and canonical isolation. All nine helper tests pass.
- Added an evidence-aware planning endpoint that authenticates the owner, fetches the saved variant, checks the revision, and accepts only referenced existing profile, project, or approved CV evidence.
- Gemini can suggest Hero introduction, About copy, and selected projects. The suggestions are validated against the typed command bus before being shown; no proposal is applied automatically.
- Studio shows each proposed value, explanation and evidence IDs with individual **Accept** or **Reject** controls. If the draft changes, the proposal becomes stale and requires regeneration.
- On AI unavailability, a deterministic keyword-based fallback suggests only existing project evidence. It never writes speculative copy.
- Publication now requires opportunity review readiness. Private/shared variants cannot be published as public URLs until private sharing is implemented; marking the status "published" cannot bypass the Publish action.
- Public snapshot pages reject nonpublic variants. Added a dynamic sitemap for public canonical projects/variants, published pages/posts and included case studies.
- Added migration `007_private_opportunity_publication_guard.sql` to prevent anonymous direct database reads of existing nonpublic publications. **Run it immediately after `006` and before deployment.** Route checks alone cannot protect the underlying Supabase REST endpoint.

## Acceptance checks

1. Apply migration `007_private_opportunity_publication_guard.sql` in Supabase SQL Editor. Verify unauthenticated queries cannot read a private/shared publication row.
2. Create a new variant from My Projects and confirm canonical content/revision remain unchanged.
3. In the variant Studio, complete the brief and wait for "Saved to cloud". Choose **Content → Opportunity → Suggest opportunity changes**.
4. Review source IDs and warnings, accept one proposal, reject another, then undo the accepted change. Change the brief and confirm the previous plan cannot be accepted.
5. Temporarily disable Gemini to confirm existing-project fallback and the no-fabricated-copy warning.
6. Publish an eligible **public** variant and verify the canonical URL differs. A private/shared variant must be rejected by the public publish action and not appear in the sitemap.

## Honest limitations and next milestone

- An evidence ID proves the source exists; it does not prove every AI sentence is logically supported. The owner must verify suggested claims before acceptance.
- This release does **not** include signed private shares, analytics, social image routes or the V21 Nebius gateway. Those remain next-phase work and require separate migrations/configuration.
- No live Supabase migration, authenticated browser workflow, or Gemini API call was executed from this environment. Those are owner acceptance steps.

## Local verification

- Typecheck and ESLint passed.
- 20 test files / 117 tests passed.
- Optimized production build and bundle budget passed.
