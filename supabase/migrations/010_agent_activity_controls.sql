-- Activity recording is off by default. Settings belong to the canonical portfolio,
-- so every opportunity variant follows the same owner's preference.
create table if not exists public.agent_activity_settings (
  canonical_project_id uuid primary key references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.agent_activity_settings enable row level security;
create policy "owner reads agent settings" on public.agent_activity_settings for select
  using (owner_id = auth.uid());
create policy "owner creates agent settings" on public.agent_activity_settings for insert
  with check (owner_id = auth.uid() and exists (
    select 1 from public.projects p where p.id = canonical_project_id
      and p.owner_id = auth.uid() and p.variant_of_project_id is null
  ));
create policy "owner updates agent settings" on public.agent_activity_settings for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and exists (
    select 1 from public.projects p where p.id = canonical_project_id
      and p.owner_id = auth.uid() and p.variant_of_project_id is null
  ));

-- Metadata-only history can be erased by its owner at any time.
create policy "owner clears agent events" on public.agent_events for delete
  using (owner_id = auth.uid());
