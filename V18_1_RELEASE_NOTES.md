# Voxfolio V18.1 — Section Cinema

V18.1 is an acceptance/visual-quality release of the V18 milestone (no new product capability, no schema change).
Every homepage section below the Hero on the three orbital templates now has its own relevant, animated 3D set piece
instead of a static background.

Applies to: **Cinematic Orbit**, **Architectural Grid**, **Editorial Depth**.
Deliberately untouched: Kinetic Gallery, Velocity Atelier (covered by a test), the Hero and its single WebGL canvas.

## Section set pieces

| Section | 3D concept | Motion |
|---|---|---|
| About | Identity crystal: real octahedron (8 clip-path facets) + three orbiting rings with satellites + depth plates. Headshot gets a pointer-tilt frame | Slow spin; scroll rotates the crystal; pointer parallax |
| Experience | Time tunnel: 7 frames rushing toward the viewer, receding floor grid, milestone pillars | Continuous forward motion; scrolling pushes you through the tunnel |
| Skills | Gyroscope: three counter-rotating rings + pulsing core. Skill bars "charge up" with a glowing head | Ring rotation; scroll roll/yaw; bars animate on reveal |
| Projects | Floating display panels in an angled gallery corridor, drifting crystal shards. Cards tilt in 3D with glare and layered depth | Panels bob and parallax at different depths |
| Contact | Signal beacon: radar pulses on a floor plane, rising light shaft, orbiting satellite | Pulses; shaft brightness follows scroll |

Template art direction (same content contract, different presentation):
- **Cinematic Orbit** — full orbital vocabulary (crystal, circular rings, gyroscope).
- **Architectural Grid** — technical: wireframe cube, square gimbal frames, crosshair markers, denser floor grid.
- **Editorial Depth** — restrained: fewer objects, softer light, 30% lower amplitude.

Every section also gets a depth-of-field heading reveal, a light-sweep along its top rule, and staggered card entrances.

## How it works (architecture fit)

- **No new WebGL context.** Scenes are GPU-composited CSS 3D (`perspective`, `preserve-3d`). The one-canvas rule is preserved.
- One shared engine per portfolio (`section-cinema-engine.ts`): a single `IntersectionObserver`, one document-level scroll listener, one rAF loop.
  It writes only CSS custom properties and data attributes. Off-screen scenes have animations paused.
- Container-relative: works in the Studio's bounded canvas scrollbar and on public pages (window scroll). Sizes use container-query units, so the narrow Studio canvas behaves like a phone.
- Presentation-only: no change to `SiteDocument`, commands, revisions, snapshots, SEO or publication.
- Honors `document.scene.motion` (`calm` / `dynamic` / `still`) and `document.scene.intensity`.

## Accessibility and safety

- Scenes are `aria-hidden` and non-interactive; text contrast is protected by darker card glass and edge fades.
- Progressive enhancement: nothing is hidden until the engine reports ready. SSR, no-JS, `prefers-reduced-motion` and `motion: still` render complete, static, fully readable content.
- Pointer tilt/parallax only on fine-pointer hover devices. Touch devices get scroll-driven depth and reveals.
- Mobile / narrow canvas (< 760px container): secondary objects hidden, primary objects parked beside headings.

## Files

New: `src/features/portfolio/section-cinema.tsx`, `section-cinema.css`, `section-cinema-engine.ts`, `section-cinema-math.ts`,
`section-cinema-math.test.ts`, `section-cinema.test.tsx`
Modified: `src/features/portfolio/portfolio-sections.tsx` (wrapper + scene wiring only)

## Verification

Automated (clean tree): ESLint pass · TypeScript pass · Vitest 14 files / 82 tests pass (15 new) · Next.js production build pass ·
bundle budget pass (largest chunk 370 KB, total 2,292 KB; previously 2,290 KB).

Headless Chromium (software rendering): all five sections on all three templates at 1440px; the real Studio canvas at ~760px;
390px mobile with no horizontal overflow; reduced motion; `motion: still`; engine state (in-view gating, scroll-driven progress,
tilt and reset, nested-scroller detection); zero page errors.

## Needs the owner's real-device test

1. Real GPU frame rate on a mid-range laptop and phone (Chrome, Safari, Firefox).
2. Touch devices: reveals and scroll depth (no hover tilt expected).
3. Studio: select each section from the left panel; confirm the canvas scrolls and the scene follows. Change template/scene motion and intensity; confirm content is preserved.
4. Publish and open `/p/[slug]`; confirm parity with the Studio preview.
5. OS "Reduce motion" on: confirm static, readable sections.

## Commit message

```
feat(portfolio): add cinematic 3D scenes to homepage sections (V18.1)

Add CSS-3D section set pieces (identity crystal, time tunnel, gyroscope,
display-panel gallery, signal beacon) to the Cinematic Orbit, Architectural
Grid and Editorial Depth templates, driven by a single scroll/pointer engine.
No new WebGL context; honors scene motion/intensity, reduced motion and
progressive enhancement. Kinetic Gallery and Velocity Atelier are unchanged.
```
