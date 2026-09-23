# Voxfolio V20.1 — Opportunity review gate

V20.1 makes the opportunity workflow reviewable before any public release.

## What changed

- New opportunity variants capture a compact source snapshot at creation time.
- The Opportunity editor now shows a review checklist: title, audience, substantive brief, and selected approved case studies.
- Studio highlights the differences between the current variant and that source snapshot.
- A variant cannot move to **Ready for review** until all checklist items are complete.
- Existing variants remain compatible. They show a clear note when no earlier source snapshot exists.

## Important behaviour

- This is not automatic publishing. The portfolio-level Publish action remains the owner-controlled immutable release step.
- The snapshot is only for transparency; it does not restore, overwrite, or mutate the canonical portfolio.
- The same guard applies to manual, voice, and text-chat initiated status changes because all paths use the command pipeline.

## Manual acceptance test

1. Create an opportunity from a canonical project in **My projects**.
2. Open **Content → Opportunity** in its Studio.
3. Confirm the review checklist starts incomplete, then complete its four items.
4. Confirm **Ready for review** becomes selectable.
5. Change the Hero intro or About copy and confirm the source-difference area identifies the tailored field.
6. Confirm the canonical project is unchanged.

## Verification

- TypeScript typecheck passed.
- ESLint passed.
- Vitest passed: 18 files / 105 tests.
- Production build passed.
- Bundle budget passed.
