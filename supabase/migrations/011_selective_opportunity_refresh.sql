-- Atomic source-revision gate for owner-approved, selective opportunity updates
-- This function never writes to the canonical project or its publication.
create or replace function public.apply_opportunity_source_review(
  p_variant_id uuid,
  p_source_id uuid,
  p_source_revision integer,
  p_expected_revision integer,
  p_document jsonb
) returns integer language plpgsql security invoker set search_path = public as $$
declare current_source integer;
declare next_revision integer;
begin
  select revision into current_source from public.projects
  where id = p_source_id and owner_id = auth.uid() and variant_of_project_id is null for share;
  if current_source is null then raise exception 'source_not_found'; end if;
  if current_source <> p_source_revision then raise exception 'source_revision_conflict'; end if;
  if p_document->>'projectId' is distinct from p_variant_id::text
    or (p_document->>'revision')::integer is distinct from p_expected_revision + 1
    or p_document #>> '{opportunity,canonicalProjectId}' is distinct from p_source_id::text
    or (p_document #>> '{opportunity,sourceRevision}')::integer is distinct from p_source_revision
    then raise exception 'invalid_refresh_document'; end if;
  update public.projects set document = p_document, revision = revision + 1,
    source_revision = p_source_revision, updated_at = now()
  where id = p_variant_id and owner_id = auth.uid() and variant_of_project_id = p_source_id
    and revision = p_expected_revision
  returning revision into next_revision;
  if next_revision is null then raise exception 'variant_revision_conflict'; end if;
  insert into public.project_revisions(project_id, owner_id, revision, document, source)
  values (p_variant_id, auth.uid(), next_revision, p_document, 'manual');
  return next_revision;
end; $$;
