# Voxfolio V27.2 — Voice-created private drafts

This cumulative archive includes V27 and V27.1. Keep your existing `.env.local`, Supabase project and Git history. There is **no new database migration**.

## What caused the reported stall

The V27.1 onboarding agent had no `create_private_draft` tool. It could discuss creation, but its statement that it was waiting for the server did not represent an actual save request. Meanwhile the manual request could send stale optional project fields after the user skipped the project. The API returned a generic `Invalid project details` message for any other invalid field. A skill label such as “computer analysis research expert” exceeds the site's 32-character-per-skill limit, so that is another possible cause visible in the supplied screenshot; this is a client-data inference rather than a diagnostic from the live server.

## Changes

- Vox now invokes the same authenticated `/api/projects` creation endpoint as the manual button via a `create_private_draft` tool. This only creates a private draft; the public Publish action remains in Studio. No success is claimed before the server responds, and a saving indicator is visible in the conversation and beside the create button.
- Clicking or telling Vox to skip the first project removes its previously confirmed title and summary from the create request. Optional skills, education and website links can be skipped by voice. After the design interview, these optional fields can also be typed on the right; Vox is informed when the typed value is approved.
- The client checks the actual guided creation schema before sending; the server reports the specific invalid field. Skill labels are limited to 32 characters each and no more than eight skills; the application never silently cuts a confirmed skill to pass validation.
- Repeated tool calls while a save is in progress do not send a second request. After a confirmed successful save, additional calls return the same project ID. A network interruption reports uncertainty and asks the user to check **My projects** before trying again.

## Manual checks in your environment

1. Start `/start` in Build with Vox, confirm name, role, introduction, answer all five design questions and choose a template. Tell Vox, “Skip my first project, then create my private draft.” Check that the saving indicator appears promptly and that you land in Studio with **no** first project and no public URL. The browser network panel should show exactly one successful `POST /api/projects`.
2. Test a first project you previously approved, then click **Skip first project** before creation. Check that the draft has no first project. Test “create my private draft” twice quickly; expect one saved project, without a duplicate in My projects.
3. Provide an overlong skill such as “computer analysis research expert”, then request the draft. Expect a visible “Core skills (item N)” error on the conversation side; the draft must **not** be saved. Correct that label to 32 characters or fewer (or tell Vox to skip skills), then request creation again.
4. After selecting the template, have Vox explain that education, skills, website and first project are optional. Type an education or website value on the right and move focus away; confirm it appears in the saved draft. Try the manual create button with the same data and confirm it uses the same validation.
5. Interrupt the network after clicking Create. Read the error and check **My projects** before retrying. Finally use the separate Studio Publish control to make a completed draft public; initial voice creation must never publish it by itself.

Automated verification: TypeScript, targeted lint and the production build passed. The full test suite passed: 163 tests across 34 files. Browser microphone, AssemblyAI, authenticated Supabase and public publication tests require your connected environment.

## GitHub

From your existing repository folder:

```bash
git add -A
git commit -m "fix(voxfolio): create private drafts directly from voice"
git push origin main
```
