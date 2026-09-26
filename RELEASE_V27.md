# Voxfolio V27 — Voice-led creation and governed publishing

This is one cumulative release based on V26. Replace your local project with this archive (preserve your existing `.env.local` and database), then deploy the same source. No new Supabase migration is required.

## What changed

- `/start` now features voice-led creation. Vox can propose a name, role, introduction, skills, education, a first project, five design preferences and a real template selection. Exact fields remain pending until separately confirmed by speech or the accessible review control; only confirmed fields populate the portfolio. Wrong spellings can be corrected with the nearby text field. A signed-in user's confirmed work survives a reload in the same browser tab using session storage; it is removed after project creation. It is not synced across devices.
- CV import is absent from the voice path. The existing manual route retains CV import as an optional disclosure and the previous template-only route remains available for accessibility and recovery.
- Studio Vox now stages exact-detail edits (names, role, institutions, employers, titles and URLs) for a separate spoken or typed confirmation turn. It can create a blog/page draft with first paragraph, excerpt and SEO fields in a single validated command. Cover media still requires an owner upload.
- Vox can review the selected website or a specific page/article, read back the exact publication selection and public URL, and publish following explicit confirmation on a separate turn. The review is invalidated when the draft, slug or selection changes or the dialog is dismissed. Publication runs through the existing revision-aware server snapshot and ownership checks. A private opportunity cannot publish publicly.
- Vox can summarize the signed-in owner's projects from the existing projects API. It does not delete projects, upload media, or perform unsupported dashboard actions.
- Added tests for fact confirmation, private blog draft creation and local publication review.

## Setup

- Keep your existing server-only `ASSEMBLYAI_API_KEY`, Supabase environment settings, and the previously applied database migrations through `016_publication_snapshot.sql`.
- Never put server secrets into variables beginning with `NEXT_PUBLIC_`, screenshots, or this zip.
- If the voice provider is unavailable, use the accessible manual route. Existing portfolios and published URLs continue to function.
- The currently configured onboarding token is limited to 300 seconds per session, so a longer conversation may require resuming the same-tab interview.

## Manual acceptance checklist

1. Start signed in and choose **Build with Vox**. Grant the microphone. Check that partial speech appears as you speak and Vox's reply is audible. Say a name with ambiguous spelling (for example, Sufian versus Sufyan). Before approval, the review form must not change. Correct the spelling, confirm the new read-back, and ensure only the corrected name appears.
2. Confirm role and introduction. Give the five design choices by voice and choose a template. Confirm the actual visual template preview changes. Add one real project title and summary if desired. Click **Create private portfolio draft** and verify saved Hero, About, skills, education and first project; verify the project is still unpublished.
3. Refresh `/start` partway through the interview: confirmed values should remain in that browser tab. Complete creation and verify the temporary creation state is cleared. Try a second browser or device and note that interview progress is not shared there.
4. Try **Use keyboard and text** with the microphone denied. Confirm the five guided answers and project creation work. Verify optional CV import still appears there and cannot override a voice-confirmed field in the separate voice path.
5. In Studio, ask Vox to change the exact hero name, employer, university, project title, or URL. Verify the first request only produces a read-back and does not save. Say “yes” on a later turn and verify Studio, Live Canvas and saved revision update. Try “no” and a corrected spelling; confirm the old proposal cannot apply.
6. Ask Vox to draft a blog article. Verify it is a draft with title, excerpt, SEO fields and first paragraph; open Blog in the editor. Add a cover image yourself. Ask to publish the specific article. Before confirming, check that Vox lists required missing fields and cannot publish an incomplete article.
7. Ask “publish my website”. Confirm the exact list of selected sections/pages/posts and the public URL. Say “yes” on the next turn, then check the real public page. Repeat but edit the slug, a section or a checkbox before saying yes: confirmation must be rejected until you review again. Close or cancel the dialog: a later “yes” must not publish.
8. Create a private opportunity variant and ask Vox to publish it: the operation must be refused and direct you to opportunity visibility controls. Ask Vox to summarize projects, then confirm the owner-only names and revision numbers are accurate.
9. Interrupt the voice connection or simulate provider unavailability. Confirm that navigation and basic exact commands via text still work, partial publication never occurs, and the editor remains usable. Check mobile width, keyboard-only navigation, reduced motion and an NVDA/VoiceOver pass on the new creation controls.

## Automated verification performed here

- TypeScript typecheck passed.
- Targeted ESLint passed.
- Vitest suite passed: 32 files / 159 tests.
- Next.js production build passed after code changes, then typecheck and focused tests were rerun for the final edits. Hosted voice sessions, real Supabase publication and screen-reader user testing require your environment.

## GitHub (from your replaced project folder)

```bash
git add -A
git commit -m "feat(voxfolio): add voice-led creation and governed publishing"
git push origin main
```

Do not use `git init` or force-push when the folder is already linked to your existing GitHub repository. Preserve your local `.env.local` outside the archive.
