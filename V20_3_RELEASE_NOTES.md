# V20.3 — Private opportunity delivery

V20.2 repaired OpenCode's unfinished evidence-aware opportunity planning and provided per-suggestion review; V20.3 adds revocable, expiring private delivery and public discovery metadata. The canonical project and all unreviewed drafts remain unchanged by these operations.

## Deploy in order

1. Apply `supabase/migrations/007_private_opportunity_publication_guard.sql`. Until this migration is applied, shared or private publications may be accessible through the previous permissive anonymous publication policy. Do not publish Shared variants before applying it.
2. Apply `supabase/migrations/008_opportunity_share_tokens.sql` to install the hashed-token table, owner policies, hourly aggregate event table, and a narrowly scoped read-only share lookup.
3. Deploy this code together with both migrations. Set `NEXT_PUBLIC_SITE_URL` to the deployment's actual HTTPS origin to generate canonical URLs and sitemap entries.

## What's included

- Shared variants can be published as immutable snapshots, while their ordinary `/p/slug` URL remains unavailable to visitors.
- Owners can create, copy, list, and revoke seven-day `/s/<token>` links for the current published Shared snapshot. Only token hashes are stored; re-publishing supersedes previous snapshot links. The shared route retains the bearer token across internal pages and posts and uses noindex and a no-referrer policy.
- Share-open counts are bucketed by hour, not individual visitor/session/IP. This is an approximate activity indicator, not unique-view analytics.
- A dynamic sitemap lists public-only portfolio roots, projects, pages, and posts. Public portfolio OG images use published identity. The earlier canonical Person structured data remains intact.

## Owner acceptance before announcing completion

- Sign in as the owner; create a variant, switch to Shared, complete review, publish it, create a link, and open home plus a nested page/post from a fresh private browser session.
- Confirm the normal `/p/slug` page and OG image return unavailable for that same Shared publication, and `/s/<token>` is absent from sitemap and search metadata.
- Revoke the link and confirm it fails. Generate a second link, republish, and confirm the old link fails; advance expiry in a test environment to check expiry. Confirm a second account cannot list or revoke the owner's shares.
- Publish a Public variant and confirm sitemap, case studies, articles, and OG image remain accessible; verify a Private variant cannot be published.
- Validate SQL migration/RLS behavior against a real Supabase instance and run mobile, keyboard, and accessibility checks. Automated checks cannot substitute for those integration tests without database credentials.

## Deliberate next work

Nebius/Nemotron integration and durable professional memory require a configured provider account and model. Richer case/article schema and detailed analytics are not included in V20.3; they remain candidates for later validated releases.
