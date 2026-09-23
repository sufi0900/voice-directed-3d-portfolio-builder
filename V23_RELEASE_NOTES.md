# Voxfolio V23 — selective opportunity source review

This is a single cumulative release through V23. Earlier releases are included.

## New workflow

1. Edit the canonical portfolio and save it.
2. Open an existing opportunity variant → Content → Opportunity → Review source updates.
3. Compare the variant's current role, Hero introduction, About heading/overview, and individual case studies with the latest canonical source. Tailored values are flagged for careful review.
4. Select only the changes to import. The source portfolio, other variants, opportunity brief, publication, visibility and unselected fields remain untouched. New case studies remain unfeatured until explicitly selected as evidence. Case-study media metadata is imported with a selected study.
5. The server checks owner access and both source and variant revisions, saves an independent revision, then reloads the saved draft to align Studio, undo/history and the Live Canvas. If either revision changed, compare again.

## Database upgrade

After earlier migrations 001–010, run only `supabase/migrations/011_selective_opportunity_refresh.sql` before deploying V23. It adds an atomic owner-scoped RPC; it does not rewrite any existing project or publication. If 009 or 010 is still pending, apply them in order first.

## Manual acceptance checks

1. Create or open a variant and change its Hero introduction; edit the canonical role and one case study. Compare the source. Select the role only; confirm the tailored Hero, variant brief, selected evidence and canonical project remain intact.
2. Add a new canonical case study with an image, import it selectively, confirm its image loads in preview, and confirm it is not featured until you select it in Evidence to feature.
3. After comparison, change either source or variant in a second tab. Apply the old comparison and confirm a conflict is shown with no partial import; repeat the comparison.
4. Publish the variant, edit the source, import one update into the draft, and confirm the previously published snapshot stays unchanged until you explicitly publish again. Verify Undo/History.
5. With a different account, confirm both comparison and apply return no source data. Check mobile layout for long before/after text.

## Scope and limits

Role, introduction, concise About fields and case studies are supported here. Skills, Education, Experience, pages and posts are not automatically offered for source refresh. Source changes are identified by comparing the latest source and variant, so a case-study difference can reflect tailoring as well as a source edit; the owner must inspect it. AI wording still requires human verification against cited evidence. No live Supabase or authenticated browser verification was possible in the isolated environment.
