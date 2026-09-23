# Voxfolio V18 — Velocity Atelier

V18 replaces the unaccepted Aurora Archive experiment with a genuinely different automotive portfolio template.

## What is new

- **Velocity Atelier** template with a bright ivory/daylight visual system.
- **Velocity Roadster** scene built from procedural React Three Fiber geometry.
- Recognizable car composition with rotating wheels, flowing road markings, subtle suspension, pointer-responsive parallax, warm studio lighting and contact shadows.
- Editorial showroom hero with a compact lower-left identity card instead of the prior split-layout or labeled-object pattern.
- Light portfolio sections, cards, navigation and public footer tailored to the automotive art direction.
- Responsive creation-library preview and accessible static car fallback.
- Reduced-motion support stops the road, wheels, suspension and pointer motion.

## Contract changes

- Added `velocity-atelier`, `velocity-roadster` and the `ivory` background token.
- Removed Aurora Archive from schema, creation, manual scene selection, renderer and voice allowlists.
- Template switching continues to preserve identity, content, media, pages, posts and publication state.
- Selecting Velocity Atelier clears any old skill focus because the car does not carry skill labels.

## Verification

- ESLint: passed
- TypeScript: passed
- Vitest: 12 files / 67 tests passed
- Next.js production build: passed
- Bundle budget: passed (largest chunk 370 KB; total 2290 KB)
- Headless Chrome desktop visual review: passed
