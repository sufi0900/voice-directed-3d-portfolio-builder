# V26 implementation architecture

## Save and publish chain

The Studio holds a local draft. Local command revisions track editing; a separate ref tracks the database row revision. `useDraftSave` serializes persistence and `drainDraftQueue` continues until the newest snapshot is confirmed. Publication awaits this queue instead of comparing the two counters. API calls are bounded, errors are visible, and finally blocks clear busy state.

`publication-selection.ts` builds a public snapshot from the previous live document plus explicitly selected draft groups. It validates selected content, preserves unchecked live content, excludes new unchecked drafts, supports item unpublishing and removal, and retains referenced media. API validation precedes SQL. Migration 016 locks the owned project, verifies its revision and prior live publication ID, enforces opportunity identity/privacy, and supersedes/inserts a publication atomically. Saved drafts remain untouched.

The first publication needs all home groups. Later publications can be selective. Hero and About share the profile portrait: selecting either also updates that portrait. Design includes scene configuration; homepage structure includes ordering/visibility. Opportunity identity is always taken from the current saved variant so a stale publication cannot relax privacy.

## Editing contract

Tiptap runs client-side with SSR immediate rendering disabled. Its JSON is validated through a restricted node/mark schema before dispatch. The shared command bus stores rich JSON and compatible plain blocks. Public rendering creates React elements from allowed nodes, validates links, and resolves images against known media; it does not execute arbitrary HTML. Old documents are converted into editor content lazily. Legacy mutation commands are guarded after conversion to prevent hidden formatting loss.

## UI contract

Narrow Studio keeps the Content dropdown and two-column tabs. Expanded Studio gets a wider writing surface and full navigation. Publish owns the review checklist and actionable readiness messages. Individual article/page publication reuses the same save/snapshot route. Public homepage journal cards and dedicated Blog routes read published snapshot content. Dashboard deletion requires confirmation; canonical portfolios with dependent variants are protected. Visitor settings explicitly save and synchronize the live visitor group.

## Regression evidence

Tests cover database/local revision divergence, edits arriving during save, failed-save retry, equivalent hydration, selected/unselected publication, first publication requirements, selected invalid pages, staged removals, independent unpublishing, republishing edits, legacy rich-text migration, and safe public rendering. Existing voice, opportunity, template, provider resilience, and domain tests remain included.

External acceptance: run migration 016 and the release checklist against the actual Supabase/Vercel installation. Do not infer authenticated runtime or visual correctness from compilation alone.
