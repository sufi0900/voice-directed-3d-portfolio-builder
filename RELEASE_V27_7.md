# Voxfolio V27.7 — Guided interview and Studio voice reliability

This is one cumulative archive. Extract it into your existing repository, preserving its Git history and local environment configuration. No new database migration or API key is required.

## Updates

- Voice onboarding now requires at least two core skills. Each skill is entered in its own field with a 32 character limit; the 2–8 skill rule is checked again before saving. Older incomplete sessions keep their valid answers; an invalid saved skill list is cleared for correction. Errors clear when the corresponding value changes.
- Name, professional role and introduction can be typed at their current interview step. Moving out of a field saves the exact typed wording and tells Vox to move to the next unfinished question. The right panel reveals later fields when their turn arrives. Template previews appear after the five design questions and scroll into view.
- Voice tool calls are checked against the current interview stage. Vox cannot choose a template before design answers or move to design before skills. Manual confirmation stops queued spoken audio, updates Vox's instructions, and proceeds from the saved state. Onboarding uses the supported English voice `michael`.
- The Studio agent has a longer silence window for multi-part instructions and receives the currently visible section when starting or restarting. Opening an existing saved portfolio presents a microphone opt-in dialog; creating a private draft shows a celebration and attempts a short browser speech announcement, where autoplay is permitted. The microphone starts only after the visitor clicks Continue with Vox. The voice assistant can be turned off afterwards.

## Manual acceptance checklist

1. Create a new voice draft. Speak a name, confirm it, then say “I am a web designer.” Confirm the role and check that **Web designer** appears in the right field. Stop and restart Vox. It should resume from the first incomplete field, without asking for the name or role again.
2. At the role step, type **Web designer**, tab out, and check Vox advances to introduction. Type or speak an introduction, then check the skills editor becomes available while the template list remains hidden.
3. Enter **Web design** and **UI design** as separate skills. Add a third skill, then attempt a 33 character skill. Check the field limit and the inline guidance. Save two valid skills, finish the design questions, and check the template list scrolls into view. Try to create a draft before two skills and confirm it stays disabled.
4. If an older browser tab has the previous comma-separated, overlong skill string, reload /start and check earlier valid answers remain; reenter short skills. After correcting a prior save error, confirm the error disappears and creation succeeds without opening a new account or deleting the old draft.
5. While Vox is describing a pending name or role, press **Yes, this is exact**. The old speech should stop and the next question should begin. Press **Correct wording or spelling** in another attempt and check the old read-back stops. Test both mouse and keyboard activation.
6. Finish the interview, skip the optional first project, create a private draft and check Studio opens with a celebration and microphone opt-in. Browser autoplay may block the short static speech; the visible celebration must remain. Open that project again from My projects and check Vox offers to start without preemptively requesting microphone permission.
7. In Studio navigate to About or Blog posts, stop Vox, and start it again. Check its opening question refers to the visible section. Speak a multi-part instruction with a short thinking pause, then test interrupting the assistant; assess latency and ensure separate edits are applied only when confirmed as required.
8. On desktop and mobile, check the right panel stages remain readable, the skill list is keyboard accessible, and the template preview remains reachable. Verify projects and previously published pages still open.

Automated checks do not verify live speech transcription, browser autoplay, or provider-side voice behavior. Test these with an authenticated account, a working AssemblyAI key, and a microphone after deployment.

## GitHub commands

Run inside your existing Git repository after replacing its source with this cumulative archive:

```bash
git status --short
git add -A
git commit -m "fix(voxfolio): synchronize guided interview and studio voice"
git push origin main
```
