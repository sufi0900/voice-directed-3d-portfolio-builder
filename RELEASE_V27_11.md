# Voxfolio V27.11 — mobile workspace layout

This is a single cumulative update with the V27.10 code and all previous migrations. Copy the archive over the existing Git checkout without replacing its `.git` directory or local environment settings.

## What changed

- On narrow screens (up to 900px), Studio has **Canvas**, **Edit**, and **Vox** tabs instead of stacking a full-height editor, preview, and fixed voice panel on top of each other. The voice panel stays mounted when switching tabs so a conversation can continue while the owner views the canvas or edits fields.
- Canvas is the default mobile view. Selecting Edit opens the full editor, and selecting Vox opens its transcript and mic controls. Hiding Vox returns to Canvas. Preview mode shows the canvas without the workspace tabs.
- Small-screen top-bar actions, content editor navigation, public portfolio headers, blog/case study headings, and long article content receive narrower layout and overflow rules.

## Manual acceptance checks

Test in browser device emulation at 320px, 375px, 430px, 768px and 900px, then at 1280px. Use a real phone for the microphone check. At each width, confirm no page-level horizontal scrolling.

1. Sign in and open an existing Studio portfolio. Confirm Canvas is visible and the Edit/Vox tabs are reachable without scrolling through the chat transcript. Check the published URL actions and the top-bar preview button.
2. In Vox, start a voice session, speak a change, switch to Canvas and Edit and back to Vox. Confirm the session and transcript persist, and the canvas updates. Hide Vox, then reopen it using the Vox tab.
3. In Edit, open Content, Design, 3D Scene, and Opportunities; edit a field, save, and review the canvas. Check both expanded and normal editor modes. Open the publish dialog and check its options fit on screen.
4. Check `/`, `/start` (guided interview, spelling correction, template selection), `/projects`, `/projects/[projectId]/settings`, a published `/p/[slug]`, its blog index, article, site page, and project detail on mobile.
5. At desktop width, confirm the three-column Studio and existing panel resize controls remain intact.

**Verification limits:** Source and CSS structure were checked, including matched CSS braces. This recovered workspace lacks the project's installed dependencies; offline `pnpm install --frozen-lockfile` failed because the package metadata is absent. A browser run, TypeScript check, and production build could not be performed here. Run `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in your normal environment before deploying, and perform the mobile checks above. No new Supabase migration or environment key is introduced in V27.11. If migration 017 from V27.9 is still pending, apply it as described in `RELEASE_V27_9.md`.

## Git commands

```bash
git status --short
git add -A
git commit -m "fix(voxfolio): make studio and public pages usable on mobile"
git push origin main
```
