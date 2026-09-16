create or replace function public.restore_project_revision(p_project_id uuid, p_target_revision integer, p_expected_revision integer)
returns integer language plpgsql security invoker set search_path = public as $$
declare
  current_project public.projects%rowtype;
  target_document jsonb;
  restored_document jsonb;
  next_revision integer;
begin
  select * into current_project from public.projects
  where id = p_project_id and owner_id = auth.uid() for update;
  if current_project.id is null then raise exception 'project_not_found'; end if;
  if current_project.revision <> p_expected_revision then raise exception 'revision_conflict'; end if;

  select document into target_document from public.project_revisions
  where project_id = p_project_id and owner_id = auth.uid() and revision = p_target_revision;
  if target_document is null then raise exception 'revision_not_found'; end if;

  next_revision := current_project.revision + 1;
  restored_document := jsonb_set(
    jsonb_set(target_document, '{revision}', to_jsonb(next_revision), true),
    '{updatedAt}', to_jsonb(now()::text), true
  );
  update public.projects set document = restored_document, revision = next_revision, updated_at = now()
  where id = p_project_id and owner_id = auth.uid();
  insert into public.project_revisions(project_id, owner_id, revision, document, source)
  values (p_project_id, auth.uid(), next_revision, restored_document, 'restore:' || p_target_revision::text);
  return next_revision;
end; $$;
