# Voxfolio V18.2 — Velocity Atelier "Night Atelier"

A visual and 3D overhaul of the Velocity Atelier template. No schema, command, revision, SEO or publishing changes.
This release is **cumulative**: it also contains V18.1 "Section Cinema" (the orbital templates' section scenes), which V18.2 builds on.

## What changed

### 1. Theme: from washed-out beige to "Night Atelier"
- The sunlit beige studio (cream floor, wall, fog, panels and card all in near-identical tones, plus a `backdrop-filter` blur on the hero copy) is replaced by a dark graphite showroom (`#07090d`) with ember and ice light and warm-white type.
- Hero copy sits on a clean gradient with an accent rule: no frosted glass, no blur on text.
- Accent drives the whole palette (ember / teal / violet / lime) and the car's paint.
- Template default background is now `ink` (was `ivory`); description updated. Existing documents keep their stored background; the template CSS is dark regardless.

### 2. A new, original 3D car (replaces the box-primitive toy)
- Procedural GT coupe built in code: no downloaded assets, no third-party marks, no licence obligations, ~0 KB of model files.
- Body lofted from cross-sections with real wheel-arch openings; glass canopy with solid roof panel; LED headlamp signatures; full-width tail bar; door cuts, intakes, mirrors, wing, diffuser, quad exhausts; 10-spoke alloys with brake discs and calipers.
- Lighting: procedural studio reflection map assigned only to the car (floor and props stay free of image-based light), polished reflective floor, baked contact shadow.
- Motion: camera intro dolly, headlights switch on, light streaks and gantries cruise at wheel-synced speed, wheel spin, body roll/pitch/idle tremor, moving reflections across the paint, pointer parallax and scroll-linked camera.
- Performance: render loop pauses when the hero is off-screen; `lite` floor and fewer particles on narrow / low-core devices; still / reduced-motion renders one static frame.
- Composition is container-aware: car in the right third beside the copy on wide layouts, centred above the copy when the layout stacks (mobile and the Studio's narrow canvas).

### 3. Automotive 3D scenes for every section below the hero
Uses the V18.1 scroll/pointer engine (CSS 3D, no extra WebGL context):
About: alloy wheel on a turntable + paint swatches · Experience: night road, light-bar gantries, streaks · Skills: instrument cluster (arc, needle, shift-lights follow scroll) ·
Projects: showroom light rail, light cones, gallery frames · Contact: headlights, anamorphic flares, bokeh.

## Files
New: `src/features/scene/velocity/` (`spline.ts`, `car-geometry.ts` + test, `car-parts.ts`, `car-model.tsx`, `textures.ts`, `studio-environment.ts`, `velocity-stage.tsx`);
`src/features/portfolio/section-cinema*.{ts,tsx,css}` (V18.1) and `section-cinema-velocity.css`.
Rewritten: `src/features/scene/velocity-roadster.tsx` (same export, same scene family).
Modified: `portfolio-sections.tsx`, `template-contracts.ts`, `commands.test.ts`, and the Velocity block of `src/app/globals.css`.

## Verification
Automated: ESLint · TypeScript · Vitest · Next.js production build · bundle budget (see the final report for exact counts).
Visual (headless Chromium, software WebGL): hero and all five sections on desktop, 390px mobile, the real Studio canvas, the template-picker preview.

## Still needs your real-device test
1. Frame rate on a mid-range laptop and phone (Chrome, Safari, Firefox). The reflective floor is the costliest element.
2. Studio: choose Velocity Atelier, change accent (paint follows), set scene motion to "still" and back.
3. Publish and open `/p/[slug]`.
4. OS "Reduce motion": hero renders one static frame; all content stays readable.

## Commit message
```
feat(velocity): Night Atelier theme, procedural 3D coupe and automotive section scenes (V18.2)

Replace the beige box-primitive roadster with an original procedural GT coupe
(lofted body, real wheel arches, detailed alloys, LED lamps) lit by a procedural
studio environment on a reflective floor, with an intro dolly, cruising streaks
and scroll/pointer camera. Restyle the template as a dark graphite showroom and
add automotive CSS-3D scenes to every section below the hero. Container-aware
hero layout; reduced-motion and still modes preserved.
```
