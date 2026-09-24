-- Apply after 011. Anonymous recipient feedback on shared opportunity pages.
create table if not exists public.opportunity_share_feedback (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.opportunity_shares(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  clarity integer not null check (clarity between 1 and 5),
  relevance integer not null check (relevance between 1 and 5),
  presentation integer not null check (presentation between 1 and 5),
  comment text,
  submitted_at timestamptz not null default now()
);
create index if not exists opportunity_share_feedback_share_idx on public.opportunity_share_feedback(share_id);
alter table public.opportunity_share_feedback enable row level security;
-- Recipients (anon) can submit feedback for a valid, unrevoked, unexpired share
create policy "anon submit feedback on active share" on public.opportunity_share_feedback
  for insert with check (
    exists (
      select 1 from public.opportunity_shares s
      where s.id = opportunity_share_feedback.share_id
        and s.revoked_at is null
        and s.expires_at > now()
    )
  );
-- Owners can view feedback on their shares
create policy "owners view feedback on own shares" on public.opportunity_share_feedback
  for select using (
    owner_id = auth.uid()
    and exists (
      select 1 from public.opportunity_shares s
      where s.id = opportunity_share_feedback.share_id
        and s.owner_id = auth.uid()
    )
  );