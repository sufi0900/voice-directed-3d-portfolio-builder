# Voxfolio V24.2 — cumulative release

This ZIP includes the previous V24.1 work and the changes below. Install this one ZIP, not multiple patches.

## Fixes

- `/start` now places Vox's optional conversation, template selection and verified profile form in separate full-width areas. Compact fields use a responsive grid. The assistant no longer copies arbitrary final speech into a person's name, role, skills, education or URL. Users enter and verify these exact values before saving. Voice remains an optional goal brainstorming tool; interview choices remain editable controls. Typing a conversation note is local to this page and is not silently saved to the portfolio.
- The published Visitor Vox dialog no longer returns an invalid value from a React effect (the `destroy is not a function` screenshot).
- Opportunities have a visible Studio tab even for a canonical portfolio. My Projects lists main portfolios separately from opportunity pages and gives each page its own edit and live links.
- ChatGPT connection and Visitor Vox settings are accessible from each main portfolio's My Projects card at `/projects/{projectId}/settings`. The connections screen includes setup steps. A status line shows whether Visitor Vox is enabled in the draft.
- Visitor knowledge documents persist as full extracted readable text in private database rows. Supported files: TXT, MD, PDF and DOCX; maximum 2 MB and 200,000 extracted characters per file, 10 per portfolio. Oversized documents are rejected with an explicit message instead of silently truncated. Originals are processed temporarily; the saved text and filename remain available to the owner across logins. Remove a document from Settings at any time.
- Uploading a document does not immediately make it public. Enable Visitor Vox and publish the main portfolio in Studio to activate uploaded text. New uploads need another publication. Deleting a document removes it immediately from the knowledge store. The database publication guard prevents an owner from setting a document's published flag directly.
- Text answers search passages from all saved, published documents and the published portfolio. Voice uses an AssemblyAI tool to look up evidence for each question instead of copying all documents into the opening prompt. If the provider or knowledge route is unavailable, visitors can still use text (provided the server keys and migration are configured). Voice generated wording cannot guarantee factual accuracy; test responses against your source text.

## Setup

1. Replace your local source with this cumulative ZIP. Keep your existing `.env.local` and your private data. No live database content is bundled.
2. In your existing Supabase project's SQL Editor, run only `supabase/migrations/015_visitor_documents.sql` after migrations 001–014. The SQL editor may flag `DROP TRIGGER IF EXISTS` as destructive. The trigger is recreated immediately and no user table or document is dropped; inspect the full migration before running. This migration creates a new private table and a controlled publication function.
3. Ensure `.env.local` and your Vercel environment include server-only `SUPABASE_SERVICE_ROLE_KEY` and `VISITOR_AGENT_HASH_SECRET` (random 32+ character value), plus `ASSEMBLYAI_API_KEY` for voice. Existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` remain separate browser values. Restart the local server and redeploy after environment edits. Never put secret keys in `NEXT_PUBLIC_` variables or Git.
4. ChatGPT Actions require a publicly deployed HTTPS URL and production `NEXT_PUBLIC_SITE_URL` set to that host. In My Projects → Connections & Visitor Vox, create a private project key; import `https://YOUR-HOST/api/connect/openapi` into your private GPT Action; set API key authentication to Bearer. This is a private GPT Action, not a shared plugin or multi-user MCP server. A shared MCP integration requires per-user OAuth and is not part of this release.
5. In My Projects → Connections & Visitor Vox, upload documents and enable the widget. Return to Studio and click the main Publish action. Your public canonical `/p/{slug}` page shows the widget. Opportunity variants remain isolated and cannot use the canonical document knowledge endpoint.

## Manual verification checklist

- In Chrome at 1440 px, 1024 px, 768 px and 390 px, visit `/start` and choose Build with Vox. Confirm the interview and template preview do not overlap, there is no horizontal scrolling, and name/role/intro fields remain legible. Speak your name and degree in a voice session, then confirm none of the exact profile fields changed automatically. Enter precise values manually, complete goal choices, select a template and create the private draft. Without an AssemblyAI key, confirm manual creation still works.
- Visit My Projects. Check main portfolios and opportunity pages in distinct groups. Use Create opportunity page on a main portfolio, then return and open that page. In Studio, the Opportunities tab should be visible on both the main portfolio and the variant.
- From a main portfolio card, open Connections & Visitor Vox. Create a GPT key and confirm the instructions appear, then revoke it. On a deployed HTTPS instance, add the key as a private GPT Action, read the draft, make an approved change, verify its revision in Studio, and verify that a revoked key stops working. Do not share the actual key in screenshots.
- Upload a TXT with an answer near its END and a second PDF or DOCX containing unrelated facts. Confirm both filenames and extracted full text remain after signing out and back in; ask about the END fact after enabling and publishing. Ask an unsupported question and confirm the no-answer fallback. Upload a document after publishing; confirm it is not used until the next publication. Delete a published document; confirm its answer disappears. Turn off Visitor Vox, publish again, and confirm the widget disappears. Test a private or shared opportunity page: it must not show the widget.
- Test visitor voice with a short supported question and an unsupported question; verify it calls the evidence lookup, avoids made-up answers and stays usable when voice permissions are denied (text remains available). Actual provider calls consume quota.
- Local checks: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm check:bundle`. The automated checks do not exercise a real Supabase project, real microphone/AssemblyAI session, custom GPT, or signed-in browser flow; run the steps above in your environment.

## GitHub commit commands (PowerShell, project directory)

```powershell
git status
git add .
git commit -m "feat(voxfolio): refine onboarding and persistent visitor knowledge"
git push -u origin main
```

If `origin` is not set, first run `git remote -v` and configure the intended GitHub repository. Do not paste several commands as one line; do not use `--force`. `.env.local` and credentials must stay out of the commit.
