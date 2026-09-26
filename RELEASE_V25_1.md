# Voxfolio V25.1 — Distinct template layouts

This cumulative package includes V25 and every earlier milestone.

## Correction
The three V25 templates previously shared one hero component and most section markup. They now have separate hero compositions and stronger, full-page layouts:

- Rose Studio: portrait on the left, editorial copy on blush stock, an oversized About pull quote, two-column skill cards, staggered project spreads and a centered contact finale.
- Midnight Bento: dashboard masthead, separate identity and portrait cards, a metric strip, asymmetrical About/Skills cards and a three-column project dashboard.
- Olive Journal: compact byline portrait, oversized journal masthead, ruled section index, chronological career records, linear skill rows and wide horizontal project stories.

The same approved facts and image assets flow into each art direction. Shared section IDs still support navigation; main public title remains H1. The creation flow, Studio canvas and published homepage render these same hero variants. Mobile container breakpoints adapt each composition.

## Setup
No new SQL migration, API key or dependency. Keep your existing environment file and deployed database setup. Replace your project with this single cumulative package and run `pnpm install`, `pnpm dev`.

## Verification
All 143 automated tests passed, TypeScript and lint passed. Production build passed. The remote browser could not open localhost, so visually test the running site on your machine.

## Manual acceptance
1. Open `/start`, choose each new template, and scroll its preview through every section. Check they look structurally different, not only different in color.
2. In Studio switch Rose → Midnight → Olive; inspect Hero, About, Experience/Education, Skills, Projects and Contact for each. Verify content, cover images and portrait persist when switching.
3. Confirm canvas preview and published URL show the same design. Open blog, project, About and Opportunity pages from each theme.
4. At desktop width and narrow phone width, check that text does not overlap, images crop correctly, navigation scrolls to exact sections, and the editor panels keep their own dark interface.
5. Upload a portrait; confirm all three hero layouts display it with alt text. Repeat with no portrait; initials should display.
6. Hide/reorder a section, use long name/role text, then switch all three templates. Ensure no section becomes unreachable.
7. Speak or type “Switch to Rose Studio”, “Switch to Midnight Bento”, and “Switch to Olive Journal”; verify the template changes in Studio.

## Git
```sh
git add .
git commit -m "fix(templates): differentiate V25 hero and section layouts"
git push origin main
```
