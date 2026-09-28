# Voxfolio V27.12 — template review and voice draft creation

This cumulative archive includes V27.11 and all earlier files. Copy it into the existing Git repository without overwriting its `.git` directory or local secrets.

## Fixes

- Clicking a template now only previews it. Owners can browse repeatedly; **Confirm this template** under the preview is the explicit commitment. The optional details panel and private draft button remain gated until confirmation. Previewing a different design after confirmation clears that confirmation.
- Vox's `choose_template` action also previews. A separate `confirm_template` action requires an explicit spoken confirmation. Both paths keep the same state and do not advance after a preview alone.
- The onboarding WebSocket previously held onto the draft-save callback from the first render, so voice creation could use incomplete form state even though the direct button succeeded. It now calls the latest save callback. The same stale-callback problem is addressed for template preview and optional-field skipping.
- Common save phrases include “Create it now,” “Create it again,” and “Create my first draft now.” The existing save deduplication and server result are retained.

## Manual acceptance checks

1. On `/start`, complete the required guided answers and portfolio purpose. Click through three different template previews. Confirm the optional fields are **not** unlocked and the private draft button stays disabled.
2. Click **Confirm this template** below the intended preview. Confirm the optional details appear and the draft button becomes available. Preview another template; confirm that draft creation is locked again until you explicitly confirm the new choice.
3. Repeat using Vox: ask to preview one design, another design, then say **Confirm this template**. Check the selected design matches the preview and only then hear the optional-details prompt.
4. Say “Create it now,” “Create my first draft now,” or “Create my private draft.” The saving state should appear immediately, the new project should be visible in My Projects, and Studio should open once. Repeat a request during the save to check it does not create a second project. If a save fails, note the exact inline error and check the browser network response for `/api/projects`.
5. Verify keyboard-only setup and the direct private draft button still work. Test after ending and restarting Vox mid-interview.

This workspace does not have the project's dependency installation (the offline package cache is incomplete), so full TypeScript, Vitest, build and live AssemblyAI/Supabase verification could not run here. Source flow structure and representative speech-intent cases passed local checks. Run `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in the usual checkout, then complete the manual checks on Vercel before recording the demo. V27.12 adds **no SQL migration or environment variable**. Migration 017 from V27.9 remains required if it has not already been applied.

## Git commands

```bash
git status --short
git add -A
git commit -m "fix(voxfolio): separate template preview and confirmation and restore voice draft creation"
git push origin main
```
