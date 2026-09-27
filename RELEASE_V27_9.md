# Voxfolio V27.9 — Restore onboarding voice sessions

This is a **single cumulative archive** containing V27.8 and earlier source. Copy into your existing Git checkout without replacing its `.env.local` or Git history.

## Cause and fix

The screenshot shows the response from `/api/assemblyai/onboarding-token`: the onboarding SQL function in migration 014 allowed just **five new voice sessions per owner per day**. Ending and restarting an interview uses a new single-use AssemblyAI token, so normal demo preparation quickly exhausted the allowance. Studio obtains tokens from another endpoint and does not use this onboarding counter, explaining why Studio still worked.

Migration `supabase/migrations/017_vox_interview_demo_sessions.sql` keeps the per-account atomic limit but raises it to **20 interview starts per day**. Existing starts today remain counted: someone at five can immediately start up to 15 further sessions after running the migration. The counter resets on the database day. Temporary token requests that AssemblyAI rejects no longer consume the onboarding allowance. Provider 429, app daily limit and missing database setup now produce distinct messages. A genuine AssemblyAI account quota or billing restriction requires checking the AssemblyAI account; the app cannot bypass that restriction.

## Required Supabase step

1. Open your existing Supabase project's **SQL Editor**.
2. Open `supabase/migrations/017_vox_interview_demo_sessions.sql` from this archive. Paste its **entire contents** into a new query and run it once. It replaces the function; it does **not** delete portfolio or interview records.
3. If you never applied migration 014, apply `014_private_content_connections.sql` first and then run 017. If other intervening migrations have not yet been applied, use your normal ordered migration process.
4. Deploy the updated code to Vercel. No new environment variable is required. `ASSEMBLYAI_API_KEY` must already be present for both onboarding and Studio voice.

## Manual checks for the demo

1. On `/start`, sign in and press **Talk to Vox**. Verify a real mic permission prompt and a spoken greeting. End and restart at least six times; the sixth start should now work after the migration.
2. Confirm manually entered answers survive each restart. Continue through two short skills, one purpose choice, template choice and private draft creation.
3. If onboarding still says **20 voice interview starts**, the new app cap has actually been exhausted for that account. If it says **voice provider usage or rate limit**, check the AssemblyAI console. If it says **setup is unavailable**, verify migration 014 then 017 in the correct Supabase project and check deployment logs.
4. Check Studio voice still works on an existing portfolio; Studio's token endpoint was not changed. Test both on the deployed Vercel URL, not just localhost.

Verification in this workspace: TypeScript check and 176 tests pass. Next.js compiled, checked types and generated 21 pages, but its final cleanup twice failed with an `ENOTEMPTY` error inside the generated `.next/export` directory; a completed production build is therefore **not verified** for V27.9 here. Run `npm run build` in your clean local checkout or check the Vercel deployment before recording the demo. Live login, provider quota and Supabase migration also require the manual checks above.

## Git commands

After copying this cumulative archive into your existing Git repository:

```bash
git status --short
git add -A
git commit -m "fix(voxfolio): restore onboarding voice session availability"
git push origin main
```
