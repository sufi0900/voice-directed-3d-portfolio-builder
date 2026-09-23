# V25 — product acceptance and launch hardening

## Implemented in this increment

- Added a pure opportunity delivery-readiness contract in `src/domain/opportunity-acceptance.ts`.
- Added tests covering canonical portfolios, incomplete variants, stale publications, and non-shared visibility.
- Added owner-scoped `GET /api/projects/[projectId]/opportunity-acceptance`.
- Added a Studio-ready `OpportunityAcceptance` component that explains each incomplete gate without mutating or publishing anything.

## Required integration

Mount `OpportunityAcceptance` in the opportunity section next to the existing share controls. The component intentionally requires an explicit refresh so the owner sees the current saved/publication state.

## V25 acceptance gate

The implementation is not complete until the owner runs the end-to-end runbook with real Supabase, AssemblyAI, storage, provider, browser, mobile, accessibility, and deployment environments. Record command output and manual results rather than inferring them from static checks.
