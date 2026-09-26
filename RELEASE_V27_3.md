# Voxfolio V27.3 — patient voice turns and Studio welcome

This **single cumulative archive** contains the complete V27.2 project plus these changes. No new SQL migration is needed. Keep your `.env.local`, Supabase data, and Git history when replacing the source files. Creating a draft remains distinct from public publication.

## Changes

- The onboarding voice session waits longer through natural mid-sentence pauses and accepts interruptions. When the user starts speaking, queued Vox speech and its unspoken captions stop. Full assistant captions appear after queued speech finishes, and interrupted replies are not shown as completed speeches. Vox is asked to keep its replies short and to stop describing a template when the user moves on.
- The saved interview state now computes the **next unfinished question**. Restarting after End voice announces the confirmed answers and the already selected template. A late agent tool call cannot replace the selected template unless the user actually asks to change it. “Yes, yes, proceed with next” can confirm the pending read-back.
- A clear final voice request such as “Publish Now” or “create my private draft” starts the authenticated project save directly; it no longer depends on the model selecting the save tool. Simultaneous voice/tool requests share the same in-flight save; duplicate calls after success return the existing project ID. An error is shown in the conversation and the form, and the saving indicator appears during the request. “Publish Now” **creates a private draft**, not a public website.
- On successful voice creation Studio opens with a short celebration and a Studio-specific Vox greeting. Its primary button starts Vox and the agent explains the editor, canvas and voice panel. Where the browser permits both microphone access and autoplay at entry, Vox attempts to start automatically. Browser audio policies may require the user to press **Continue with Vox**. This button remains visible when the automatic attempt cannot start.
- Studio voice turn detection also waits more patiently between the user's phrases.

## Manual checks on your connected machine

1. In `/start` choose **Build with Vox**, speak a name and role, and pause mid-sentence for approximately one second during the introduction. Vox should wait. Interrupt a spoken template explanation with “proceed to the next step”; the existing speech/caption should stop, and Vox should move forward without repeating the entire explanation.
2. Say “Yes, yes, proceed with next” after an exact read-back. Confirm the field advances **once**. Make all five design choices, select a template, **End voice conversation**, and start Vox again. It must remember the chosen template, acknowledge it by name, and ask only for the next missing step. Test a reload of the same tab as well.
3. Complete the required fields and say “Publish Now”. Expect one `POST /api/projects`, a visible saving indicator, and then the Studio celebration. Check that **My projects** has exactly one new private draft and that no public URL has appeared. If a field fails validation, read its error in the voice panel, correct it, and try again.
4. Press **Continue with Vox** on the celebration. Confirm the Studio assistant speaks its welcome and points to the left editor, center canvas and right voice panel. If the microphone permission or autoplay policy blocks automatic speech, this button must start it after permission is granted. Try **Explore Studio** to dismiss without a microphone.
5. Navigate back to Studio from My projects: the celebration should only appear on the immediate voice-creation handoff. Public publishing is still done explicitly with the separate Studio **Publish** control.

Automated verification: 164 tests, TypeScript, lint, production build. Audio device behavior, real AssemblyAI interruptions, project saves and Supabase publication must be checked with your connected credentials and browser. For best barge-in results use headphones if speaker output leaks into your microphone.

## GitHub

Run these inside your existing Git checkout after copying the updated files from this archive:

```bash
git add -A
git commit -m "fix(voxfolio): make onboarding voice resumable and greet studio drafts"
git push origin main
```
