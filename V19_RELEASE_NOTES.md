# V19 — Synchronized Gemini voice/text agent

## Delivered

- Explicit `navigate_to` support for every Studio workspace and portfolio section.
- Automatic Content/Design/3D panel focus and Live Canvas navigation after assistant edits.
- Authenticated Gemini server endpoint for intent planning and multi-turn typed requests.
- Gemini-first, fact-preserving copy refinement with optional OpenAI recovery.
- Paste-friendly text chat beside the live voice session.
- Automatic transcript scrolling and processing state feedback.
- Short activation, speech, processing and completion cues with a visible mute control.
- Allowlisted tool validation; no assistant permission to publish, upload files, delete projects or execute code.

## Configuration

Add these server-only values to `.env.local`, then restart the development server:

```dotenv
GEMINI_API_KEY=your_private_gemini_key
GEMINI_CONTENT_MODEL=gemini-3.8-flash
```

Do not prefix either variable with `NEXT_PUBLIC_`.

## Acceptance checks

1. Say “Go to About” and confirm both editor and Live Canvas focus About without creating a revision.
2. Ask Vox to update the About heading and confirm the value, editor and preview update together.
3. Ask Vox to improve a Hero introduction using supplied facts and verify no new claims are introduced.
4. Type “Add my TikTok profile,” then paste a complete URL when prompted.
5. Open an existing blog draft through voice or text and update one content block.
6. Confirm new messages remain visible automatically and the sound toggle suppresses all cues.
7. Confirm assistant attempts to publish, upload media, delete the project or run code are refused.

## Verification completed

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` — 96 tests passed
- `pnpm build`

Automated browser control was unavailable in the execution environment. Complete the signed-in, credential-backed acceptance checks above locally.
