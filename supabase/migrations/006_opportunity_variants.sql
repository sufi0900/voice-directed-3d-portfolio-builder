-- V20: a variant is a separate owner-controlled project, never an in-place
-- rewrite of its canonical portfolio. These nullable fields preserve the
-- existing projects table and make dashboard grouping/querying inexpensive.
alter table public.projects
  add column if not exists variant_of_project_id uuid references public.projects(id) on delete set null,
  add column if not exists source_revision integer,
  add column if not exists opportunity_status text not null default 'canonical'
    check (opportunity_status in ('canonical', 'draft', 'review', 'published', 'archived'));

create index if not exists projects_owner_variant_idx
  on public.projects(owner_id, variant_of_project_id, updated_at desc);

-- Keep the lightweight dashboard status in sync with the validated document.
create or replace function public.save_project(p_project_id uuid, p_document jsonb, p_expected_revision integer, p_source text default 'autosave')
returns integer language plpgsql security invoker set search_path = public as $$
declare next_revision integer;
begin
  update projects set
    document = p_document,
    revision = revision + 1,
    updated_at = now(),
    opportunity_status = coalesce(p_document #>> '{opportunity,status}', opportunity_status)
  where id = p_project_id and owner_id = auth.uid() and revision = p_expected_revision
  returning revision into next_revision;
  if next_revision is null then raise exception 'revision_conflict'; end if;
  insert into project_revisions(project_id, owner_id, revision, document, source)
  values (p_project_id, auth.uid(), next_revision, p_document, p_source);
  return next_revision;
end; $$;

-- Clone a saved canonical document into an isolated opportunity project.
-- The function is security invoker: RLS/auth.uid() remains the authority.
create or replace function public.create_opportunity_variant(
  p_canonical_project_id uuid,
  p_variant_id uuid,
  p_name text,
  p_document jsonb
)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  source_project public.projects%rowtype;
begin
  select * into source_project from public.projects
    where id = p_canonical_project_id and owner_id = auth.uid() for share;
  if source_project.id is null then raise exception 'canonical_project_not_found'; end if;
  if source_project.variant_of_project_id is not null then raise exception 'variants_cannot_be_nested'; end if;
  if char_length(trim(p_name)) not between 1 and 80 then raise exception 'invalid_name'; end if;
  if p_document->>'projectId' <> p_variant_id::text or coalesce((p_document->>'revision')::integer, -1) <> 0 then
    raise exception 'invalid_variant_document';
  end if;

  insert into public.projects (
    id, owner_id, name, creation_mode, template_id, document, revision,
    variant_of_project_id, source_revision, opportunity_status
  ) values (
    p_variant_id, auth.uid(), trim(p_name), 'guided', source_project.template_id,
    p_document, 0, source_project.id, source_project.revision, 'draft'
  );
  insert into public.project_revisions(project_id, owner_id, revision, document, source)
  values (p_variant_id, auth.uid(), 0, p_document, 'opportunity_variant_created');
  return p_variant_id;
end; $$;
