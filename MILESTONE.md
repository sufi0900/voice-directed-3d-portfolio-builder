# Milestone 1 — Governed 3D editor and voice commands

## Completed

1. A strict `SiteDocument` schema is the single source of truth.
2. Manual controls dispatch typed commands rather than modifying components directly.
3. Voice function tools dispatch the same commands with the source recorded as `voice`.
4. Every valid change creates a revision and can be undone or redone.
5. The current site document persists locally and safely falls back if stored data is invalid.
6. `OrbitalShowcase` is reusable and controlled entirely through document parameters.
7. The scene supports approved palettes, presets, motion modes, intensity and skill focus.
8. Reduced-motion preferences and WebGL rendering failures have fallback behavior.
9. AssemblyAI uses a server-only key and single-use browser token.
10. Voice capture, spoken responses, transcripts, interruption, stop and client-side tools are connected.
11. Cleanly ended AssemblyAI sessions are submitted for provider-side deletion.
12. TypeScript, ESLint, seven unit tests and the production build pass.

## Manual verification requiring the owner’s environment

- Add the real AssemblyAI key to `.env.local`.
- Grant microphone permission in Chrome or Edge on localhost.
- Run each command in the README and confirm spoken output, visible transcript and scene change.
- Confirm the session disappears from the AssemblyAI session list after ending cleanly.

## Next SDLC checkpoint

- Replace browser-only persistence with authenticated projects and PostgreSQL revisions.
- Add the Guided Creation and Choose a Template entry flows.
- Add CV upload, extraction review and approved-fact provenance.
- Add immutable preview/publish revisions and a public portfolio route.
- Add the second reusable 3D scene family only after the first scene’s voice test passes.
