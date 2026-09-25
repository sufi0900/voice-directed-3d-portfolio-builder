-- Private GPT Action connection credentials. Run after 013.
create table if not exists public.portfolio_connections (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 label text not null check (char_length(label) between 1 and 60),
 key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 revoked_at timestamptz
);
create index if not exists portfolio_connections_owner on public.portfolio_connections(owner_id, project_id);
alter table public.portfolio_connections enable row level security;
create policy "owners read their connections" on public.portfolio_connections for select to authenticated using (owner_id = auth.uid());
create policy "owners create connections for own projects" on public.portfolio_connections for insert to authenticated
 with check (owner_id = auth.uid() and exists (select 1 from public.projects where id = project_id and owner_id = auth.uid()));
create policy "owners revoke their connections" on public.portfolio_connections for delete to authenticated using (owner_id = auth.uid());
-- Service role only: never allow anonymous callers to submit a hash and gain access to a project.
create or replace function public.external_connection_project(p_hash text)
returns table(project_id uuid, document jsonb, revision integer) language sql security definer set search_path = public as $$
 select p.id,p.document,p.revision from public.portfolio_connections c join public.projects p on p.id=c.project_id and p.owner_id=c.owner_id
 where c.key_hash=p_hash and c.revoked_at is null and p_hash ~ '^[0-9a-f]{64}$' limit 1;
$$;
revoke all on function public.external_connection_project(text) from public, anon, authenticated;
grant execute on function public.external_connection_project(text) to service_role;
create or replace function public.save_external_connection_project(p_hash text,p_document jsonb,p_expected_revision integer)
returns integer language plpgsql security definer set search_path = public as $$
declare v_project uuid; v_owner uuid; v_revision integer;
begin
 select c.project_id,c.owner_id into v_project,v_owner from public.portfolio_connections c
 where c.key_hash=p_hash and c.revoked_at is null and p_hash ~ '^[0-9a-f]{64}$';
 if v_project is null or p_document->>'projectId' <> v_project::text then raise exception 'invalid_connection'; end if;
 update public.projects set document=p_document,revision=revision+1,updated_at=now(),
 opportunity_status=coalesce(p_document #>> '{opportunity,status}',opportunity_status)
 where id=v_project and owner_id=v_owner and revision=p_expected_revision returning revision into v_revision;
 if v_revision is null then raise exception 'revision_conflict'; end if;
 insert into public.project_revisions(project_id,owner_id,revision,document,source)
 values(v_project,v_owner,v_revision,p_document,'external_action');
 return v_revision;
end; $$;
revoke all on function public.save_external_connection_project(text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.save_external_connection_project(text,jsonb,integer) to service_role;
create table if not exists public.external_connection_meter (
 key_hash text not null,usage_day date not null,uses integer not null default 0,primary key(key_hash,usage_day)
);
alter table public.external_connection_meter enable row level security;
create or replace function public.claim_external_connection_use(p_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uses integer;
begin
 if not exists(select 1 from public.portfolio_connections where key_hash=p_hash and revoked_at is null) then return false; end if;
 insert into public.external_connection_meter(key_hash,usage_day,uses) values(p_hash,current_date,1)
 on conflict(key_hash,usage_day) do update set uses=public.external_connection_meter.uses+1
 where public.external_connection_meter.uses < 100 returning uses into v_uses;
 return v_uses is not null;
end; $$;
revoke all on function public.claim_external_connection_use(text) from public,anon,authenticated;
grant execute on function public.claim_external_connection_use(text) to service_role;
create table if not exists public.vox_interview_meter (
 owner_id uuid not null references auth.users(id) on delete cascade,
 usage_day date not null,
 uses integer not null default 0,
 primary key(owner_id,usage_day)
);
alter table public.vox_interview_meter enable row level security;
create or replace function public.claim_vox_interview_use()
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uses integer;
begin
 if auth.uid() is null then return false; end if;
 insert into public.vox_interview_meter(owner_id,usage_day,uses) values(auth.uid(),current_date,1)
 on conflict(owner_id,usage_day) do update set uses=public.vox_interview_meter.uses+1
 where public.vox_interview_meter.uses < 5 returning uses into v_uses;
 return v_uses is not null;
end; $$;
revoke all on function public.claim_vox_interview_use() from public,anon;
grant execute on function public.claim_vox_interview_use() to authenticated;
