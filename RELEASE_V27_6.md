# Voxfolio V27.6 — Multi-action voice and reviewed site-wide text replacement

This is **one cumulative archive** containing V27.5 and all earlier source. Copy into your existing Git checkout; keep `.env.local`, Git history and Supabase data. **No new Supabase migration or API key.**

## Changes

- A single request can produce up to 12 ordered assistant actions. Each completed action appears in the conversation, and Vox reports a specific failure rather than silently dropping the remaining steps. Earlier successful changes remain editable and undoable if a later step fails. The simple offline command matcher will not misread a second instruction as part of the first field's text; complex multi-action planning still needs an available AI provider.
- “Replace [exact phrase] with [exact phrase] everywhere” can scan the current portfolio draft locally even when the writing model is unavailable. Vox shows the precise phrase, affected fields and occurrence count and asks for explicit approval on a **later turn**. One validated command then updates all supported editable text at once, with a single revision and undo. If the draft changes before approval, the review expires. Publishing remains a separate action.
- The replacement scans this one portfolio's Hero, About, skills, experience, education, projects, Contact copy, standalone pages and blog posts. It covers editable rich-text nodes and their stored block equivalents, preserving links, image metadata, slugs and formatting. Exact matching is case-sensitive; a phrase split across rich formatting nodes or inside a URL, slug or image alternative text is not changed. Other portfolios and separately saved opportunity variants are outside the request scope. The search is bounded to 100 visible occurrences and 40 text locations.
- Professional role, education/experience period, project title and other exact fields still require read-back. Vox is instructed to ask for explicit owner-supplied wording for age, years of experience and measurable outcomes; it must not calculate or invent those facts. If multiple exact fields require confirmation, review each before assuming completion.
- Studio voice turn detection allows a longer thinking pause before treating a long instruction as finished. The provider still controls semantic endpointing and interruptions; actual microphone behavior must be tested in a browser.

## Manual tests (real voice, user account and browser)

1. In Studio, speak one request containing two independent safe edits, e.g. “Change my hero introduction to [exact text], and set my About heading to [exact text].” Confirm **both** sections changed, the editor focuses appropriately, the transcript reports each result and two undo operations can reverse both. Repeat through the text box. Do not assume all steps succeeded if one reports an error.
2. Say: “Replace high quality content with high quality SEO content everywhere.” Review the exact match count and locations before saying “Yes, this is correct” on a separate turn. Check Hero, About, one project and a rich-text blog article. Confirm linked URLs, page slugs, embedded images and rich formatting remain intact. Check the published site remains on the previous snapshot until the normal Publish review is completed.
3. While the replacement review is waiting, edit the draft manually, then confirm. Expect a stale-review error and **no** global replacement. Ask Vox to scan again. Test a phrase that is absent: expect a clear message rather than an empty success.
4. Say a longer request with a brief thinking pause, then interrupt Vox with a new instruction during its reply. Check that Vox finishes listening and follows the latest instruction. Test a short command immediately afterwards to gauge the latency tradeoff.
5. Ask Vox to increase your experience by a year **without** stating exact revised wording. It should request an exact owner-approved fact. Then give and confirm the exact wording. Never use an invented age, employer or achievement in the demo.
6. Temporarily disable your AI writing keys. Exact site-wide replacement, navigation and one-field direct edits should remain usable. Complex multi-action planning should report provider unavailability rather than apply only the first part accidentally.

Voice playback, ASR punctuation, real provider latency, authenticated saves and publication require manual testing. The code tests cannot certify them.

## GitHub commands

Run inside your **existing repository** after copying the updated files:

```bash
git add -A
git commit -m "feat(voxfolio): support multi-action voice and reviewed site-wide replacement"
git push origin main
```
