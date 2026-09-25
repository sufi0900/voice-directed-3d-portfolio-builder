# Voxfolio V23.2 — Template accents

This is a cumulative update to V23.1. Template selection still sets each template's intended background and accent. The displayed portfolio now consumes those colors inside the live canvas, published homepage, dedicated pages, and case studies while the Studio and Voice Assistant retain their own dark controls.

The earlier Studio theme isolation removed the template accent attribute from the editor shell. Several portfolio elements relied on that shell for their accent and therefore fell back to cyan. V23.2 applies the accent variables directly to each portfolio surface. Velocity Atelier uses its warmer coral showroom accent; Professional 2D keeps its restrained editorial palette.

## Check on your machine

1. Switch from Cinematic Orbit to Architectural Grid. In the live canvas and the public portfolio, headings, navigation focus, buttons, and section highlights should use violet along with the scene. Check a dedicated Blog or Projects page.
2. Switch to Velocity Atelier. Confirm the vehicle and portfolio accents use the matching warm coral palette in the canvas, public homepage, and dedicated pages.
3. Switch among the remaining templates, including Professional 2D. Confirm the portfolio colors update while the Studio header, editor, and Voice Assistant stay dark and legible.
4. Save and publish a revision using your configured account, then check that the published URL matches the saved theme. This requires your configured Supabase project and cannot be verified against local mock credentials.

No Supabase migration or new environment variable is required.

Suggested commit message: `fix(voxfolio): restore portfolio accents for every template`
