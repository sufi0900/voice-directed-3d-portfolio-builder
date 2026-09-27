# Voxfolio V27.5 — Resumable voice direction

This is a **single cumulative source release** containing V27.4 and earlier work. There is no new Supabase migration, model download, or environment variable. Copy the source into your existing Git checkout, keeping your credentials, Git history, and cloud data.

## What changed

- Vox remembers the last workspace and a short previous owner request separately for each portfolio in this browser. The saved portfolio remains the source of truth; reopening voice describes the saved template and current workspace, then asks for a new request rather than repeating an old action. Exact-edit and publication confirmations deliberately expire when a session ends.
- When the saved portfolio revision changes mid-session, the AssemblyAI session receives updated tool definitions and portfolio context. New posts, pages, and other newly created items can therefore be named without restarting Vox. This uses the existing voice provider, with no additional model service.
- Successful design and 3D commands return descriptive results for Vox to speak. Failed tool actions now surface a specific visible error immediately as well as returning the error to Vox for a spoken explanation. Navigation, direct edits, and publishing continue using the validated command and publication review paths.
- Studio provides quiet contextual help for the blog editor, design, opportunity review, and standalone pages. Blog conversation notes can still be copied into the reviewable article writer. Vox's instruction now asks about the owner's point, example, and evidence; the owner must review suggested content before applying it.
- Exact-detail read-back now accepts the onboarding interview's broader affirmative phrasing (for example, “yes, this is correct”) on a separate turn. Publication remains separately reviewed.

Task context is stored in this browser, not synchronized between devices. Spoken appearance descriptions depend on the live voice provider following the tool result; the app shows the same result in the transcript. AI-generated article copy still requires owner review and manual image upload. No accessibility certification is claimed without assistive-technology testing.

## Manual test checklist

1. Start a saved portfolio in Studio, say “Go to Blog posts,” end voice, reload Studio, then start Vox again. Confirm it remembers the portfolio and Blog workspace without executing the prior request again. Repeat on a second portfolio to check isolation. Note that another browser/device does not share this browser's last-workspace memory.
2. While voice is connected, create a new blog draft manually. Ask Vox to open or edit it without restarting voice. Verify that the selected editor and Live Canvas focus the correct item. End and restart, and check that the current item is described accurately.
3. Ask Vox to change a template, accent, and 3D motion. Confirm the voice reply describes the applied result after the tool completes and that the change appears in the editor/preview. Interrupt a long answer with “stop” or “go to About” and check it switches to the new request rather than repeating the old explanation.
4. Ask for an invalid social URL or attempt to publish an incomplete article. Confirm a clear visible error appears in Vox and the agent identifies what to fix. Verify the draft stays unchanged or private. Then fill the missing field and retry.
5. In Blog posts, speak through your article idea and evidence. Transfer the final owner messages to notes, generate a proposal, review it, accept it into a draft, and publish only via the existing publication review. Confirm earlier text and images remain intact. Temporarily remove an AI provider key or simulate provider failure; navigation and direct edits should still work.
6. Read through the creation and editing flow with NVDA or VoiceOver and keyboard alone: focus order, confirmation buttons, errors, progress, and spoken result description. Record any unannounced controls or actions before claiming independent screen-reader access.

Real microphone timing, voice playback, session refresh, account permissions, cloud saves, and screen-reader behavior require browser testing with your configured services.

## GitHub commands

Run within your existing repository after copying the updated source:

```bash
git add -A
git commit -m "feat(voxfolio): resume voice tasks and explain validated actions"
git push origin main
```
