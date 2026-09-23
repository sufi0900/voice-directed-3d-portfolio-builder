-- Apply after 007. Only owners can manage hashed, revocable, expiring share tokens.
create table if not exists public.opportunity_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  publication_id uuid not null references public.project_publications(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index if not exists opportunity_shares_project_idx on public.opportunity_shares(project_id);
alter table public.opportunity_shares enable row level security;
create policy "owners manage opportunity shares" on public.opportunity_shares
  for all using (owner_id = auth.uid()) with check (
    owner_id = auth.uid()
    and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
    and exists (select 1 from public.project_publications pub where pub.id = publication_id
      and pub.project_id = project_id and pub.owner_id = auth.uid())
  );

-- Privacy-first coarse open counts: at most one event per share per UTC hour; no IP or device ID.
create table if not exists public.opportunity_share_opens (
  share_id uuid not null references public.opportunity_shares(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  opened_bucket timestamptz not null,
  primary key (share_id, opened_bucket)
);
alter table public.opportunity_share_opens enable row level security;
create policy "owners view opportunity share opens" on public.opportunity_share_opens
  for select using (owner_id = auth.uid());

-- Privileged lookup returns only a live immutable publication for an active shared variant.
-- The bearer token itself is never stored in the database or returned by any listing.
create or replace function public.read_opportunity_share(p_hash text)
returns table(document jsonb, revision integer)
language plpgsql security definer set search_path = '' as $$
declare selected_share public.opportunity_shares%rowtype;
declare selected_publication public.project_publications%rowtype;
begin
  select * into selected_share from public.opportunity_shares
  where token_hash = p_hash and revoked_at is null and expires_at > now();
  if selected_share.id is null then return; end if;
  select * into selected_publication from public.project_publications pub
  where pub.id = selected_share.publication_id and pub.project_id = selected_share.project_id
    and pub.owner_id = selected_share.owner_id
    and pub.superseded_at is null and pub.document #>> '{opportunity,visibility}' = 'shared';
  if selected_publication.id is null then return; end if;
  insert into public.opportunity_share_opens(share_id, owner_id, opened_bucket)
  values(selected_share.id, selected_share.owner_id, date_trunc('hour', now() at time zone 'utc') at time zone 'utc')
  on conflict do nothing;
  return query select selected_publication.document, selected_publication.revision;
end;
$$;
revoke all on function public.read_opportunity_share(text) from public;
grant execute on function public.read_opportunity_share(text) to anon, authenticated;
