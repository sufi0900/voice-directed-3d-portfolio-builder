# Voxfolio V25 — Portfolio Collection

One cumulative release based on V24.3. Includes existing Opportunity Pages, publishing, Visitor Vox, integrations and previous fixes.

## New templates
- **Rose Studio:** blush paper, rose accent, serif typography, arched portrait, staggered project gallery.
- **Midnight Bento:** navy surfaces, blue accent, modular cards, compact capability tiles.
- **Olive Journal:** warm paper, olive accent, editorial typography, ruled sections and horizontal project entries.

All three use the same portfolio data, section order/visibility and publishing contract. Switching templates preserves facts, images, pages and projects. These are original layouts; no third-party template assets are bundled. Design research explored contemporary editorial and bento portfolio patterns.

## Integration
- Full template previews in the creation flow.
- Profile portrait upload on the Hero editor for flat templates; shared with About and published output. Alt text and removal are available.
- Professional 2D now shows the uploaded portrait in its hero.
- Template-specific Studio guidance; irrelevant 3D controls are replaced with an explanation for flat templates.
- Local voice/text commands can select the new templates without Gemini. Upload requests direct users to the real image controls.
- New accent choices remain scoped to portfolio surfaces, including dedicated pages. Studio and Visitor Vox retain their own interface styling.
- Existing Architectural Grid and Editorial Depth receive small section layout refinements.

## Setup
No new Supabase migration, API key or dependency is required for this release. Keep your existing environment configuration and previously installed migrations.
1. Back up your current project. Replace application files with this cumulative release, retaining your local environment file.
2. Run `pnpm install`, then `pnpm dev`.
3. For production, run `pnpm build` and deploy through your normal Git/Vercel workflow.

## Verification
Automated tests: 142 passed across 28 files. TypeScript and ESLint passed. Production build passed.
Browser visual verification was blocked by the browser environment refusing localhost. Live Supabase uploads, authenticated publication and microphone/provider calls require your environment and were not exercised here.

## Manual acceptance checklist
1. In Create Portfolio, preview each new template. Confirm distinct hero, skills, career, projects and contact layouts.
2. In Studio, switch between all existing and new templates. Confirm name, content, images, pages and Opportunity Pages remain intact. Undo the switch and confirm restoration.
3. Upload a portrait from Hero in a flat template; edit alt text, replace and remove it. Verify Preview and the published page use the same image.
4. Change accents and templates. Verify only the portfolio changes color, while both Studio panels and Visitor Vox stay readable.
5. Check narrow mobile, normal three-column Studio and expanded editor. Verify no horizontal overflow, cropped text or stretched images. Enter Preview from expanded mode and exit again.
6. Navigate to every homepage section, then a blog or About page and back. Confirm the canvas scrolls internally and the correct section is selected.
7. Add a project image and social links. Open the dedicated Projects, About and Blog pages. Publish and check their public links.
8. Type or speak “Switch to Rose Studio”, “Switch to Midnight Bento”, and “Switch to Olive Journal”. Confirm the canvas updates. Say “Upload my profile photo” and confirm guidance opens About rather than claiming a file was uploaded.
9. Hide/reorder sections and check the result in all three new templates. Check long titles, missing portrait, empty sections and multiple project cards.
10. Retest Visitor Vox and your external integration against the newly published portfolio. No integration credentials need changing.

## Git commands
```sh
git add .
git commit -m "feat(templates): add V25 portfolio collection and portrait-aware studio"
git push origin main
```
Before committing, ensure your environment secrets and build/dependency directories remain ignored. Do not force-push.
