# Voxfolio V27.10 — Correct spelling before advancing

This single cumulative archive includes V27.9 and all earlier updates. Copy it into your existing Git checkout, retaining your `.git` directory and `.env.local`.

The onboarding video showed that clicking **Correct wording or spelling** cleared the pending name immediately. Vox could then ask for the professional role even though the name had not been corrected. Correction is now an explicit saved interview state. Vox must wait for **Save corrected spelling**; the submitted text is validated, saved as the exact approved value, and only then does the interview advance. Pending proposals remain locked against unrelated tool calls, and the button to accept the old spelling cannot override an active correction. Repeating the same spoken proposal keeps its original proposal ID. Confirming a field in the right-side panel also clears a corresponding correction state.

## Manual checks

1. Sign in on `/start`, start Vox, say a name that Vox transcribes incorrectly, click **Correct wording or spelling**. Vox must ask you to type and submit the corrected name; the professional role should not be requested yet.
2. Type the corrected spelling and press **Save corrected spelling**. The right-side name field should show exactly what you typed, the correction box should disappear, and Vox should ask for the professional role.
3. Repeat with an incorrect professional role. End and restart Vox *during* correction; the correction prompt should remain, without repeating earlier confirmed answers.
4. Also check **Yes, this is exact**, spoken confirmation, manual right-side field confirmation, skills, purpose, template and draft creation. Confirm that an earlier pending field cannot be bypassed by asking Vox to select a template.
5. Apply the existing migration `supabase/migrations/017_vox_interview_demo_sessions.sql` if it has not been run; see `RELEASE_V27_9.md`. V27.10 adds **no new SQL or environment variables**.

Verification: TypeScript check and 177 automated tests passed before packaging; the final targeted test and check were also run after the last synchronization edit. Browser microphone and provider behavior require the manual checks above.

## Git commands

```bash
git status --short
git add -A
git commit -m "fix(voxfolio): complete spelling corrections before advancing onboarding"
git push origin main
```
