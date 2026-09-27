# Voxfolio V27.4 — Expanded voice Studio and reviewed article writing

This is **one cumulative archive**, including V27.3 and earlier source. Replace source files in your existing Git checkout; keep your `.env.local`, Git history and Supabase data. **No new database migration.** AI content generation uses your already configured server-only provider keys; the release does not add model hosting or a model binary.

## Changes

- Expanded Studio now keeps the editor at roughly 70% width and Vox at roughly 30%, while the Live Canvas remains hidden. On narrow screens Vox appears as a closable right-hand drawer. Hiding Vox does not stop a running conversation; the restore button indicates if Vox is active. The blog editor shows a contextual invitation to write with Vox.
- Under Content → Blog posts, enter at least 40 characters of your own ideas and click **Draft from my notes**. A signed-in, owner-checked API asks the currently configured AI provider to propose an introduction, H2 sections, a conclusion, an excerpt, SEO title/description and questions about missing facts. If unavailable, notes stay in the tab and the rich editor remains usable. Notes are retained for the same article in session storage while you work.
- All proposed copy is displayed before applying it. **Add reviewed copy to draft** appends to existing article content without deleting text or images, fills only blank excerpt and SEO fields, and leaves public publication status unchanged. The operation is one validated command and rejects stale proposals if the article changed during generation. The owner still chooses a cover image and uses the existing Publish review.
- In the blog Voice Panel, **Use our conversation as article notes** copies the last eight completed owner messages into the writer for review. It never sends the conversation to a writing provider until the owner presses **Draft from my notes**.
- Provider routing now uses a total request budget and shorter per-provider deadlines. Gemini's retry sequence shares its allotted time instead of allowing three full request timeouts. Navigation and exact editing remain available if AI writing cannot complete.

## Manual checks on your deployed setup

1. In Studio click **Expand editor**. At a desktop width, check that Vox stays on the right beside the editor, with no Live Canvas visible. Start a Vox conversation, open **Blog posts**, then hide and restore Vox; confirm the active conversation remains usable. Check the layout at a narrow/mobile width and use the restore drawer button.
2. Create an article, enter its title, and type at least 40 characters of genuine article notes. Request an AI proposal. Confirm the proposal lists H2 sections, excerpt, SEO fields and any questions about missing facts, and that nothing has changed in the article until you accept.
3. Press **Add reviewed copy to draft**. Confirm the rich editor shows the new paragraphs and H2 headings and that the article is still private/draft. If you had previously written copy or added an image, confirm both remain. If you already entered SEO fields, confirm they are retained.
4. Change the article title or body while a proposal is displayed, then attempt to accept it. Expect an actionable stale-draft warning and no overwrite. Generate a fresh proposal from your saved notes. Test a provider failure or unset writing keys: expect an error beside the writer and your notes and existing article intact.
5. Talk to Vox about a blog idea, then click **Use our conversation as article notes**. Confirm your own completed messages populate the notes field, which you can edit before calling the AI. Ask Vox to navigate elsewhere while writing is unavailable; navigation should still work.
6. Fill all normal article publication fields, including the cover image, then publish with the existing article or website Publish control. Confirm the article appears in the public Blog listing. AI draft review alone must not make it public.

Automated checks validate the command behavior, TypeScript, lint and production build. Real microphone playback, your configured provider accounts, browser layouts, Supabase saves and public publication require your manual checks above.

## GitHub commands

Run these inside your **existing repository** after copying the updated files:

```bash
git add -A
git commit -m "feat(voxfolio): keep Vox in expanded Studio and add reviewed blog drafting"
git push origin main
```
