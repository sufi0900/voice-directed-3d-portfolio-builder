-- Owner-approved memory is private and scoped to a canonical portfolio.
create table if not exists public.professional_memory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  canonical_project_id uuid not null references public.projects(id) on delete cascade,
  fact text not null check (char_length(btrim(fact)) between 3 and 500),
  source_note text not null check (char_length(btrim(source_note)) between 3 and 200),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists professional_memory_owner_project_idx on public.professional_memory(owner_id, canonical_project_id);
alter table public.professional_memory enable row level security;
create policy "owner reads professional memory" on public.professional_memory for select
  using (owner_id = auth.uid());
create policy "owner adds professional memory" on public.professional_memory for insert
  with check (owner_id = auth.uid() and exists (
    select 1 from public.projects p where p.id = canonical_project_id
      and p.owner_id = auth.uid() and p.variant_of_project_id is null
  ));
create policy "owner revokes professional memory" on public.professional_memory for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Operational evaluation only: record providers and outcome codes, never prompts or generated content.
create table if not exists public.agent_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  operation text not null check (operation in ('chat', 'opportunity_plan')),
  outcome text not null check (outcome in ('ok', 'local_fallback', 'provider_unavailable')),
  provider text check (provider in ('nebius', 'openrouter', 'gemini', 'openai')),
  attempts integer not null default 0 check (attempts between 0 and 4),
  created_at timestamptz not null default now()
);
create index if not exists agent_events_owner_project_idx on public.agent_events(owner_id, project_id, created_at desc);
alter table public.agent_events enable row level security;
create policy "owner views agent events" on public.agent_events for select
  using (owner_id = auth.uid());
create policy "owner records agent events" on public.agent_events for insert
  with check (owner_id = auth.uid() and exists (
    select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()
  ));
