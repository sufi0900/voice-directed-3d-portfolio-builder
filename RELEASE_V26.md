# Voxfolio V26 — Publishing and editing reliability

This is one cumulative source release based on V25.1. Existing templates, opportunity variants, canonical source review, sharing, voice navigation, and detailed About pages remain included.

## Required setup

1. Keep a backup of your current project and Supabase database.
2. Copy this release into your project; preserve your own environment values. Do not copy build caches or dependencies from an older release.
3. In Supabase SQL Editor, run **supabase/migrations/016_publication_snapshot.sql** once. Existing migrations 001–015 must already be installed. This adds an owner-authorized atomic selective-publication function. It does not delete existing content or overwrite drafts.
4. Run `pnpm install --frozen-lockfile`. Tiptap editor dependencies were added. No new environment variables are required.
5. Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
6. Restart the local app (`pnpm dev`) or deploy the updated code to Vercel. Test with a disposable portfolio before using your presentation portfolio.

Do not skip migration 016: publishing now calls `publish_project_snapshot`. The app reports a migration-specific error when the function is unavailable.

## Changes

### Saving and publication

- Replaced effects that waited for local edit counters to equal database revisions. A local edit counter can advance several times while one database save advances once; waiting for equality could leave publishing stuck.
- A serialized save queue drains current edits, then publishes using the database-confirmed revision. Concurrent saves share the queue. Requests time out, clear loading state, and expose retryable errors.
- Save failures retain the local draft in memory and attempt browser recovery storage. Cross-session revision conflicts stop publication rather than overwrite another session.
- Main Publish opens a checklist: Hero, About summary, Experience, Education, Skills, Projects, Contact, design, homepage structure, Visitor Vox, individual pages, articles, and staged removals. Select all ready items is available.
- Unselected live content keeps its current public snapshot. New unchecked drafts remain unpublished. The first publication requires homepage groups so it cannot produce a partial initial shell.
- Incomplete content is identified with missing-field explanations and a Review fields action.
- Individual page/article Publish saves first and updates only that item. Editing published content re-enables Publish changes; unchanged content remains disabled. Unpublish removes the item from the public snapshot and keeps the draft.
- Portrait uploads use unique file names, preventing a replacement upload from modifying the previously published portrait before publication.
- The database transaction verifies both the saved draft revision and publication baseline. Concurrent publication cannot silently overwrite a newer public snapshot.
- Private opportunity pages remain private. Their dialog explains that edits belong to that variant, provides a main-portfolio link, and a visibility/review action. It does not automatically change visibility or copy variant edits into the canonical portfolio.

### Editor and Studio

- Pages and articles have a continuous rich text editor: paragraphs, H2–H6, bold, italic, underline, strike, lists, quotes, code blocks, links, images, image alt text, undo/redo, and clear formatting. The page title remains H1.
- Existing block content is displayed without deleting it. Editing through the continuous editor stores structured rich content plus a text/image compatibility representation.
- Legacy block controls remain available for documents not yet edited in the continuous editor. Once rich formatting is used, legacy block mutation commands are rejected with a clear instruction to use the continuous editor, rather than silently discarding formatting. This also applies to old voice/plugin block-edit commands targeting that document. Voice navigation and other section editing remain supported.
- Upload rich-content images using the Image control. Pasted external images are rejected with guidance to upload them; arbitrary remote images are not silently published.
- URL fields normalize spaces/punctuation into a slug on commit. Duplicate URLs are still checked; genuine conflicts need a different slug.
- Errors are surfaced in the active publishing dialog/editor and a dismissible fixed notification. Save failures offer Retry saving.
- Narrow Studio uses a two-by-two main tab layout and the Content dropdown. Expanded Studio retains wider navigation and a centered, wider writing area. Existing template styling remains scoped to the portfolio.
- Detailed About page creation and its homepage link remain present.

### Public pages and dashboard

- Homepage shows up to three article cards and a link to the full Blog listing. Production includes published posts only; Studio can preview drafts.
- Existing dedicated Blog, About/site pages, and Projects routes remain in place.
- Dashboard supports confirmed deletion of portfolios and opportunity variants. A canonical portfolio with child variants must have those variants deleted first. Deletion is permanent; removing an individual content page in Studio is staged until its removal is selected for publication.
- The old ChatGPT connection card is removed from Settings. Backend connection/plugin endpoints remain for existing integrations.
- Visitor Vox has explicit Enable & save / Disable & save actions, status and success feedback, and a retry action if live activation fails. For an already published portfolio, saving these settings publishes only Visitor Vox settings.

## Required manual acceptance tests

Use a test portfolio, and check the PUBLIC URL in a separate/incognito window—not only Live Canvas.

1. **Migration:** apply 016 successfully. Create a portfolio and publish once. Verify a real public URL loads.
2. **Rapid edits:** type several Hero changes, immediately click Publish, then publish Hero only. The latest text must appear publicly; loading must finish.
3. **Selective changes:** change Hero and About summary. Publish only Hero. Public About must retain its previous text. Then publish About and verify it updates.
4. **Full publication:** create a complete About page and article. Main Publish → Select all ready items. Both must appear publicly without first pressing their individual Publish buttons.
5. **Unselected draft:** create a new draft article, leave it unchecked, publish another section. It must remain absent from the public Blog listing.
6. **Article update:** publish an article; edit its title. Publish changes must activate. After success, it must disable again until another edit.
7. **Readiness/URLs:** omit SEO description, use a duplicate URL, and try a URL with spaces. Verify actionable errors; spaces normalize on blur, but a real duplicate must remain blocked.
8. **Single-item unpublish:** unpublish an article; it disappears from homepage/Blog/public detail but its draft stays editable. Republish it and verify it returns.
9. **Page removal:** remove a duplicate About/site page, confirm, then select its removal in main Publish. Verify the correct page disappears and the retained page still works.
10. **Images:** upload a portrait and article cover without supplying alt text first. Save, publish and reload Studio/public pages. Replace the portrait but publish only Contact: the previous live portrait must remain. Publish Hero/About to reveal the replacement.
11. **Rich editor:** edit an existing block-based page, add H2/H3, numbered list, link, code, and an uploaded image. Publish, reload, undo/redo, and check formatting in public content. Ensure no cursor jumps while typing links/bold text.
12. **Failed save:** disconnect the network while editing, attempt publication, restore network and retry. Loading must clear with an error; changes must not disappear. If another session changed the project, preserve your unsaved text before reloading to resolve the conflict.
13. **Two sessions:** open the same portfolio in two tabs. Publish different changes concurrently. A stale session must receive a conflict rather than silently replace the newer snapshot.
14. **Opportunity privacy:** keep a variant private. Verify the dialog explains why it cannot publish and opens its visibility/review controls. Open the canonical portfolio, edit Hero, publish successfully without changing the variant's privacy.
15. **Opportunity review:** compare canonical updates, select/apply a change, reload, and confirm source review, suggestions and sharing remain available.
16. **Workspace:** at approximately 320px, 768px and desktop widths, test two-row tabs, Content dropdown, resizing, expanded Studio, and Preview from expanded Studio. Preview must show content and hide workspace controls.
17. **Blog routing:** with two published articles and one draft, verify homepage cards, View all articles, detail links, main navigation and browser back. The draft must not appear publicly.
18. **Visitor Vox:** enable/save on a published portfolio, confirm the public assistant appears, ask about published profile information and an uploaded document; disable/save and confirm it disappears. If document activation fails, verify the warning and retry. Real voice/API behavior needs configured provider credentials.
19. **Deletion:** on disposable data, delete a variant, then a portfolio. Verify dashboard removal and that its publication/share URLs stop serving content. Verify deleting a canonical portfolio with existing variants is blocked with guidance.
20. **Voice regression:** navigate to About, Blog and back to Experience; edit a Hero heading; confirm Studio/Canvas selection follows. Try an existing rich page legacy block edit and verify a clear limitation message instead of formatting loss.

## Verification and boundaries

**Verified in this workspace:** 154 tests passed across 31 files; production build (including lint/type validation) passed; bundle budget passed (largest chunk 370 KB, total generated chunks approximately 3,074 KB).

Automated checks include the existing suite plus regressions for selective publishing, item updates/removal, incomplete selections, rich-content rendering/legacy conversion, and server-confirmed save revision handling. See V26_ARCHITECTURE.md.

This environment does not have your authenticated Supabase project or production provider credentials. Live SQL execution, RLS/storage policies, deployed publication, microphone behavior, and responsive browser interaction require the manual checks above. The browser environment previously blocked localhost access; no visual acceptance claim is made.

Known boundaries: this is not a full bidirectional rich-document voice editor; legacy block mutations are guarded once rich content exists. Uploaded source files are processed as before; Visitor Vox knowledge remains the saved extracted text. Deleting a portfolio removes its database records and publications; orphaned storage objects are not automatically purged by this release. Keep private information out of publicly served media.

## GitHub commands

Run from your existing repository after reviewing changes. Keep environment secrets out of Git.

```powershell
git status
git add .
git diff --cached --stat
git commit -m "fix(voxfolio): stabilize publishing and improve studio editing in v26"
git push origin main
```

Use your actual branch if different. Do not use `--force`; `git commit` requires `-m` before the message.
