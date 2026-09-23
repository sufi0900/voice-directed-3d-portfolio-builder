-- V24 recipient feedback: minimal, owner-scoped and never identity-tracked by default.
create table if not exists public.opportunity_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  share_id uuid not null references public.opportunity_shares(id) on delete cascade,
  publication_id uuid not null references public.project_publications(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  message text not null check (char_length(btrim(message)) between 3 and 2000),
  contact text not null default '' check (char_length(contact) <= 160),
  created_at timestamptz not null default now()
);
create index if not exists opportunity_feedback_project_idx on public.opportunity_feedback(project_id, created_at desc);
alter table public.opportunity_feedback enable row level security;
create policy "owners view opportunity feedback" on public.opportunity_feedback for select using (owner_id = auth.uid());
create policy "owners delete opportunity feedback" on public.opportunity_feedback for delete using (owner_id = auth.uid());

create or replace function public.submit_opportunity_feedback(
  p_hash text,
  p_rating integer,
  p_message text,
  p_contact text default ''
) returns boolean
language plpgsql security definer set search_path = public as $$
declare selected_share public.opportunity_shares%rowtype;
declare selected_publication public.project_publications%rowtype;
begin
  if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then return false; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then return false; end if;
  if p_message is null or char_length(btrim(p_message)) not between 3 and 2000 then return false; end if;
  if p_contact is null or char_length(p_contact) > 160 then return false; end if;
  select * into selected_share from public.opportunity_shares
    where token_hash = p_hash and revoked_at is null and expires_at > now();
  if selected_share.id is null then return false; end if;
  select * into selected_publication from public.project_publications
    where id = selected_share.publication_id and project_id = selected_share.project_id
      and owner_id = selected_share.owner_id and superseded_at is null
      and document #>> '{opportunity,visibility}' = 'shared';
  if selected_publication.id is null then return false; end if;
  insert into public.opportunity_feedback(project_id, share_id, publication_id, owner_id, rating, message, contact)
    values (selected_share.project_id, selected_share.id, selected_share.publication_id, selected_share.owner_id, p_rating, btrim(p_message), btrim(coalesce(p_contact, '')));
  return true;
end; $$;
revoke all on function public.submit_opportunity_feedback(text, integer, text, text) from public;
grant execute on function public.submit_opportunity_feedback(text, integer, text, text) to anon, authenticated;
