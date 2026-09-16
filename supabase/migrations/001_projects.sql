create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  creation_mode text not null check (creation_mode in ('guided','template')),
  template_id text,
  document jsonb not null,
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_revisions (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null,
  document jsonb not null,
  source text not null default 'autosave',
  created_at timestamptz not null default now(),
  unique(project_id, revision)
);

alter table public.projects enable row level security;
alter table public.project_revisions enable row level security;

create policy "owners manage projects" on public.projects for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners read revisions" on public.project_revisions for select using (auth.uid() = owner_id);
create policy "owners add revisions" on public.project_revisions for insert with check (auth.uid() = owner_id);

create or replace function public.save_project(p_project_id uuid, p_document jsonb, p_expected_revision integer, p_source text default 'autosave')
returns integer language plpgsql security invoker set search_path = public as $$
declare next_revision integer;
begin
  update projects set document = p_document, revision = revision + 1, updated_at = now()
  where id = p_project_id and owner_id = auth.uid() and revision = p_expected_revision
  returning revision into next_revision;
  if next_revision is null then raise exception 'revision_conflict'; end if;
  insert into project_revisions(project_id, owner_id, revision, document, source)
  values (p_project_id, auth.uid(), next_revision, p_document, p_source);
  return next_revision;
end; $$;
