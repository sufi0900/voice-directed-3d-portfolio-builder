# Voxfolio V22 — private agent activity controls

This cumulative archive includes all releases through V22. Install this single archive; do not layer earlier patches over it.

## New

- Agent activity recording is **off by default**. Enable it from the Studio's Agent activity and privacy panel for a canonical portfolio and its opportunity variants.
- Owners can stop recording at any time, inspect a sampled 30-day project summary, and permanently clear recorded event metadata for the current project (including events older than the summary window). Each variant's event history is separate.
- Only operation, provider, outcome, attempt count and timestamp are stored. Prompt text, generated content, links and approved facts are excluded.
- Authorized, owner-scoped API endpoints for viewing, toggling and clearing activity.

## Upgrade

1. Keep your existing environment settings and Supabase project.
2. Run `supabase/migrations/009_professional_memory_agent_events.sql` if not already applied.
3. Run `supabase/migrations/010_agent_activity_controls.sql` after 009. Do not rerun 006–008 if you already applied them.
4. Deploy V22 and sign in. Open Agent activity and privacy on a portfolio and an opportunity variant, verify the same on/off preference, and check that clearing one project's history leaves the other untouched.

## Limits

- Live Supabase access, Row Level Security, provider credentials and voice calls require testing in your environment. The 30-day summary samples at most 1,000 recent events; the UI displays a plus sign when the sample reaches that limit.
- Earlier agent event rows remain until the owner clears each project. Disabling collection does not delete prior records.
- Recording preference controls only the metadata-only agent activity log. Existing provider requests necessary to answer an AI prompt are unaffected.
