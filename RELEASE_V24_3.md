# Voxfolio V24.3 — Visitor Vox published knowledge fix

This is a cumulative project release, including V24.2 and its earlier migrations. No new SQL migration is needed for V24.3. Keep migration `015_visitor_documents.sql` applied.

## Why Visitor Vox said it did not know the owner

The answer lookup used literal word overlap. Questions such as “What is his role?” do not contain the actual role or name in the published portfolio, so the search returned nothing. Voice previously received no published facts in its session context and relied on that same search. Uploaded documents also remain private until the portfolio is republished after upload.

## What changed

- Direct questions about who the owner is, their name, role, or short biography use the published portfolio identity and About text.
- Voice receives that published identity and About text when the session begins; more detailed questions still search published site content and activated uploaded documents.
- Visitor search now covers published education and public contact information as well.
- Basic identity answers still work if document storage has a temporary error. Unrelated questions retain the safe no-answer behavior.

## Manual checks

1. Enable Visitor Vox in the portfolio dashboard; publish the current portfolio. Open its public `/p/<slug>` URL in a private browser window.
2. In the Visitor Vox **text** input ask “What is his role?”, “Who is he?”, and “Tell me shortly about himself.” Check that answers reflect the **published** name, role, introduction and About section.
3. Ask an unrelated question (such as the population of Mars); Vox should say that it lacks an approved answer.
4. Upload a TXT, MD, PDF or DOCX in the dashboard and confirm it appears under Saved documents. Publish the portfolio **again**, then ask a distinctive question answered only near the end of that document. It should answer from the document; if the document is still marked “Publish the portfolio to make available,” it is not yet public.
5. Start **Talk to Vox** and repeat the identity and document questions. The voice response should agree with text. If voice cannot connect, confirm `ASSEMBLYAI_API_KEY` and microphone permissions; text lookup works independently.
6. Edit the owner's role in Studio without republishing: the public answer should still show the previously published role. Republish and verify that it changes.

## Local validation

Run `pnpm install`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`. Real microphone, AssemblyAI and Supabase checks require your own configured environment and published portfolio.

## GitHub commit commands (PowerShell)

```powershell
git status
git add .
git commit -m "fix(voxfolio): answer published identity and visitor knowledge questions"
git push origin main
```
