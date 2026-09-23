# Voxfolio V19.2 — Live Conversation and Publication Freshness

V19.2 is a stabilization release for the V19 assistant milestone. It completes progressive voice/text feedback and separates article publication freshness from whole-portfolio publication.

## Voice and chat experience

- Vox displays an animated three-dot state as soon as the user starts speaking and while the assistant prepares a response.
- AssemblyAI `transcript.user.delta` events replace the current partial utterance, so the user sees recognized speech while speaking.
- AssemblyAI `transcript.agent.delta` events append each spoken token, keeping visible captions synchronized with audio.
- Final transcript events replace their partial message without creating duplicate bubbles.
- Typed assistant replies reveal progressively after planning and validation rather than appearing as a single abrupt block.
- Only final transcript messages are persisted, preventing temporary loading bubbles from reappearing after refresh.
- Motion indicators respect the operating system's reduced-motion preference.

## Article and page publishing

- The Studio now loads the current immutable publication document as a comparison baseline.
- A published article or standalone page that is edited is labeled **published · changes pending**.
- **Publish changes** becomes active after any content or metadata change and remains disabled when the live item is already current.
- **Unpublish article/page** updates only the selected item's status and publishes the resulting snapshot.
- Item publication waits for the exact current Studio revision to finish autosaving before creating the immutable snapshot.
- Interrupted item publication requests recover without losing the saved draft or leaving the UI permanently busy.

## Whole-portfolio publishing

- The main Publish control always represents the complete website snapshot, including homepage sections, pages, articles, design, media references, and navigation.
- Clicking while edits are still saving queues **Save & publish** and publishes automatically when the latest revision reaches the server.
- A failed autosave can be retried directly from the Publish dialog.
- The top-level control reports **Changes pending** whenever the Studio document differs from the live immutable snapshot.
- Individual content publication and whole-site publication have separate visible pending targets, preventing their buttons from conflicting.

## Verification

- `pnpm typecheck` — passing.
- `pnpm test` — 102 tests passing.
- `pnpm lint` — passing.
- `pnpm check:bundle` — passing; largest chunk 370 KB.
- `pnpm build` — successful production build across all application and API routes.
- Production HTTP smoke test — rendered Voxfolio home document returned successfully.

## Suggested Git commit

```text
fix(studio): stream assistant feedback and repair publication freshness

- render live user and agent transcript deltas with typing feedback
- re-enable article publishing when live content changes
- queue whole-site publishing behind the latest autosave
- compare drafts against immutable publication snapshots
- recover cleanly from interrupted save and publish requests
```
