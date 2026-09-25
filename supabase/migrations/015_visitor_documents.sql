-- Run after 014. The extracted full text remains private until a canonical publication is updated.
create table if not exists public.visitor_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 180),
  body text not null check (char_length(body) between 10 and 200000),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists visitor_documents_project_public on public.visitor_documents(project_id, published);
alter table public.visitor_documents enable row level security;
create policy "owners read visitor documents" on public.visitor_documents for select to authenticated using (owner_id = auth.uid());
create policy "owners add visitor documents" on public.visitor_documents for insert to authenticated with check (
  owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid() and p.variant_of_project_id is null)
);
create policy "owners remove visitor documents" on public.visitor_documents for delete to authenticated using (owner_id = auth.uid());
-- Owners manage the document list, but publishing it is a separately verified database operation.
grant select, insert, delete on public.visitor_documents to authenticated;
grant select on public.visitor_documents to service_role;

create or replace function public.guard_visitor_document_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform 1 from public.projects p where p.id = new.project_id and p.owner_id = auth.uid() and p.variant_of_project_id is null for update;
  if not found then raise exception 'portfolio_not_found'; end if;
  if (select count(*) from public.visitor_documents where project_id = new.project_id) >= 10 then raise exception 'document_limit'; end if;
  new.created_at := clock_timestamp();
  new.published := false;
  return new;
end; $$;
drop trigger if exists guard_visitor_document_insert on public.visitor_documents;
create trigger guard_visitor_document_insert before insert on public.visitor_documents
for each row execute function public.guard_visitor_document_insert();

-- The API calls this only after publishing. The publication must be newer than each document.
create or replace function public.publish_visitor_documents(p_project_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_publication timestamptz;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  select pub.published_at into v_publication
  from public.project_publications pub join public.projects p on p.id = pub.project_id
  where pub.project_id = p_project_id and p.owner_id = auth.uid()
    and p.variant_of_project_id is null and pub.superseded_at is null
    and pub.document #>> '{visitor,enabled}' = 'true';
  if v_publication is null then raise exception 'publish_enabled_portfolio_first'; end if;
  update public.visitor_documents set published = true
  where project_id = p_project_id and owner_id = auth.uid() and created_at <= v_publication and published = false;
end; $$;
revoke all on function public.publish_visitor_documents(uuid) from public, anon;
grant execute on function public.publish_visitor_documents(uuid) to authenticated;
