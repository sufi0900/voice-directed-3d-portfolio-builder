-- V26: atomic selective publication; drafts are never overwritten.
create or replace function public.publish_project_snapshot(p_project_id uuid, p_slug text, p_expected_revision integer, p_snapshot jsonb, p_expected_publication_id uuid)
returns table(slug text, revision integer, published_at timestamptz)
language plpgsql security invoker set search_path = public as $$
declare selected_project public.projects%rowtype;
begin
  select * into selected_project from public.projects where id=p_project_id and owner_id=auth.uid() for update;
  if selected_project.id is null then raise exception 'project_not_found'; end if;
  if selected_project.revision <> p_expected_revision then raise exception 'revision_conflict'; end if;
  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(p_slug) not between 3 and 64 then raise exception 'invalid_slug'; end if;
  if p_snapshot->>'projectId' <> p_project_id::text then raise exception 'project_mismatch'; end if;
  if p_snapshot->'opportunity' is distinct from selected_project.document->'opportunity' then raise exception 'opportunity_mismatch'; end if;
  if coalesce(selected_project.document#>>'{opportunity,status}','canonical') <> 'canonical' and selected_project.document#>>'{opportunity,visibility}' = 'private' then raise exception 'private_variant'; end if;
  if (select id from public.project_publications where project_id=p_project_id and superseded_at is null) is distinct from p_expected_publication_id then raise exception 'publication_conflict'; end if;
  update public.project_publications set superseded_at=now() where project_id=p_project_id and superseded_at is null;
  insert into public.project_publications(project_id,owner_id,slug,revision,document)
  values(p_project_id,auth.uid(),p_slug,selected_project.revision,p_snapshot)
  returning project_publications.slug,project_publications.revision,project_publications.published_at into slug,revision,published_at;
  return next;
end; $$;
revoke all on function public.publish_project_snapshot(uuid,text,integer,jsonb,uuid) from public,anon;
grant execute on function public.publish_project_snapshot(uuid,text,integer,jsonb,uuid) to authenticated;
