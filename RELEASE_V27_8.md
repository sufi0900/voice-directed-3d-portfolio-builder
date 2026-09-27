# Voxfolio V27.8 — Shorter, synchronized Vox onboarding

This is a single cumulative source archive containing V27.7 and all previous versions. Copy it into your existing Git checkout. Preserve `.env.local`, Git history and Supabase data. No new SQL migration or API key is needed.

## What changed

- The voice path asks **one** design question: whether the portfolio should help win clients, showcase work, or find a role. The answer visibly appears as a choice in the right panel. The other four internal presentation settings receive deterministic defaults, so the existing portfolio builder and database schema still receive a complete valid interview. Previously saved values for those settings remain intact when an older interview resumes.
- Core skills entered in the individual fields are saved on leaving a field as soon as at least two valid labels exist. The extra Save core skills button has been removed. Each label still has a 32 character limit. Vox learns about the saved skills and moves to the next unfinished question.
- The user-facing progress and restart greeting contain actual questions, not internal instructions. A resumed completed template is acknowledged without reading an instruction such as “Do not ask for the template again.”
- Template previews now reflect the confirmed onboarding name, role, introduction and skills instead of showing only sample profile data. Template selection immediately reveals and scrolls to optional education, website and first project fields beneath the template preview. The optional project remains optional; it can be omitted or explicitly skipped. Mouse selections take precedence over delayed tool calls from a previous spoken turn.
- Onboarding speech no longer forces a fixed silence window. AssemblyAI's default adaptive turn detection handles both clearer short answers and a speaker who pauses while thinking. This requires a live microphone check to judge latency under the user's environment.

## Manual acceptance tests

1. With an existing partially completed interview, enter two skills manually and **tab out of the second skill**. The purpose choices should appear immediately without pressing a Save skills button; Vox should ask the purpose question once. Stop and restart the conversation: the saved skills and purpose must remain.
2. Choose **Win clients**, **Showcase my work**, or **Find a role** by voice or in the right panel. There must be no separate target audience, tone, motion or emphasis questions. The selected purpose must remain visible on reload. An existing session with some earlier design answers must still work and retain the answers already supplied.
3. Select a template by voice or mouse, then check that education, website and first project inputs appear **below the preview** and come into view. Fill each optional value and restart Vox; it should recognize the saved input. Clear or skip the project, then create the private draft.
4. Stop Vox once a template is selected; restart and listen to the greeting. It should invite optional details or a private draft in natural language, without saying instructions about templates. Select a different template manually while Vox speaks and ensure a delayed response cannot undo that click.
5. Speak one clear short answer, then one answer with a thinking pause. Evaluate response delay and interruption. The provider controls live endpointing; automated checks cannot establish real speech performance.
6. On a narrow/mobile window, verify purpose cards, template choices, optional input labels, confirmation controls and the Create private draft action are visible and reachable by keyboard.
7. Save a private draft and verify the Studio draft opens with the entered identity, short skills, correct selected template, optional project only if entered, and the intended purpose. Test published pages and existing portfolios for regressions.

## Verification and limitations

`npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` should pass locally. Actual AssemblyAI speech behavior, microphone permissions, authenticated Supabase saves and the production deployment require the manual tests above.

## Git commands

Run in your existing repository after extracting the cumulative archive:

```bash
git status --short
git add -A
git commit -m "fix(voxfolio): streamline voice onboarding and preserve manual choices"
git push origin main
```
