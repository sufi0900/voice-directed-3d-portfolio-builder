create table if not exists public.project_publications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 64),
  revision integer not null check (revision >= 0),
  document jsonb not null,
  published_at timestamptz not null default now(),
  superseded_at timestamptz
);

create unique index if not exists project_publications_live_project_idx
  on public.project_publications(project_id) where superseded_at is null;
create unique index if not exists project_publications_live_slug_idx
  on public.project_publications(slug) where superseded_at is null;

alter table public.project_publications enable row level security;
create policy "owners manage publications" on public.project_publications
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "visitors read live publications" on public.project_publications
  for select using (superseded_at is null);

create or replace function public.publish_project(p_project_id uuid, p_slug text, p_expected_revision integer)
returns table(slug text, revision integer, published_at timestamptz)
language plpgsql security invoker set search_path = public as $$
declare selected_project public.projects%rowtype;
begin
  select * into selected_project from public.projects
  where id = p_project_id and owner_id = auth.uid() for update;
  if selected_project.id is null then raise exception 'project_not_found'; end if;
  if selected_project.revision <> p_expected_revision then raise exception 'revision_conflict'; end if;
  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(p_slug) not between 3 and 64 then raise exception 'invalid_slug'; end if;

  update public.project_publications set superseded_at = now()
  where project_id = p_project_id and superseded_at is null;
  insert into public.project_publications(project_id, owner_id, slug, revision, document)
  values (p_project_id, auth.uid(), p_slug, selected_project.revision, selected_project.document)
  returning project_publications.slug, project_publications.revision, project_publications.published_at
  into slug, revision, published_at;
  return next;
end; $$;

create or replace function public.unpublish_project(p_project_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update public.project_publications set superseded_at = now()
  where project_id = p_project_id and owner_id = auth.uid() and superseded_at is null;
  if not found then raise exception 'publication_not_found'; end if;
end; $$;
