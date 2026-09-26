# Voxfolio V27.1 — Interview continuity, captions and playback

This is one cumulative archive. It includes all V27 code and the fixes below. Keep your existing `.env.local`, Supabase data and Git history when replacing the source. No new database migration is included.

## Changes

- After an interview restarts, the first greeting acknowledges the saved, confirmed name. Confirmed facts, direction choices, skipped project and template selection remain in this signed-in user's same-tab session storage. The new provider session receives these facts in its opening prompt; the provider's prior raw conversation does not survive an explicit **End voice conversation**.
- Clicking **Yes, this is exact** or correcting a field now updates the active provider conversation; a delayed call for an already-approved proposal is treated as complete. Common unambiguous affirmations such as “yes, this is correct”, “okay”, “this is done” and “proceed to the next step” are accepted. Corrections such as “yes, but the spelling is wrong” never count as approval.
- Word-level agent captions now preserve spaces and punctuation. The desktop creation view places the Vox conversation alongside progress, confirmed fields and the template previews; the layout stacks on narrow screens. Templates unlock after the five design choices. A first project can explicitly be skipped.
- Both interview and Studio audio playback reset their scheduling cursor whenever the audio context closes or restarts. Suspended playback tries to resume and surfaces a browser audio warning if it cannot. Interview interruption drops queued speech.
- Publishing reports a missing migration only when Supabase returns a missing-function error; other database errors retain their actual code and message.

## Verify publication in the actual Supabase project

The supplied screenshot says the database used by `localhost:3000` could not find the function from migration 016. An older portfolio cannot cause the SQL function to disappear. In the SQL editor of **the Supabase project named by the application's `NEXT_PUBLIC_SUPABASE_URL`**, run:

```sql
select to_regprocedure('public.publish_project_snapshot(uuid,text,integer,jsonb,uuid)') as publication_function;
```

If this returns `null`, apply the included `supabase/migrations/016_publication_snapshot.sql` in that project, following earlier migrations. If the function exists but the API still returns `PGRST202`, refresh the PostgREST schema cache:

```sql
notify pgrst, 'reload schema';
```

Then reload Studio and try publishing again. Avoid pasting secret keys into diagnostics. If another error appears, keep its code and exact message for further investigation.

## Manual acceptance tests

1. In `/start`, start voice, say a deliberately ambiguous name, check the pending review, click **Yes, this is exact**, and wait for Vox's next spoken question. It must not retry or claim a technical failure. Correct a different value with the text control and confirm the new read-back; only the corrected value should populate the form.
2. End voice, reopen it in the same tab, and ask to skip the first project. Vox must acknowledge the previously confirmed name and proceed. Repeat after page refresh; a second browser tab does not inherit this temporary state. Tell Vox “yes, this is correct”, “this is done”, and “proceed to the next step” after distinct pending proposals; say “yes, but the spelling is wrong” and confirm it does **not** approve.
3. Give the five design choices. On desktop, observe conversation on the left and progress on the right; template previews appear on the right at the design step. Click a template and confirm Vox acknowledges that particular choice. On mobile, verify the two columns stack and all buttons remain usable.
4. Watch the interim spoken captions and confirm words have spaces and punctuation. Start, end and restart voice in `/start` and Studio; verify each new session is audible. If speech is silent, check the browser tab's mute state, operating system output device/volume, browser console and the visible playback warning.
5. In Studio, use the main Publish button on both an existing and a new portfolio. If a missing-function message appears, perform the read-only SQL check above on the connected Supabase project. Confirm existing published pages remain live during an error. Finish a valid selection and verify its public URL.
6. Confirm Studio navigation, opportunity visibility rules, existing posts, manual creation and the signed-in project dashboard still work. No publication may occur without the existing review, save and server-side ownership checks.

## Verification here

TypeScript, targeted ESLint and the Next.js production build passed after the final changes. All 161 automated tests across 33 files passed. A real AssemblyAI session, browser audio device, Supabase project and screen reader require manual testing in your environment.

## Commit from your existing repository

```bash
git add -A
git commit -m "fix(voxfolio): preserve voice interview context and playback"
git push origin main
```
