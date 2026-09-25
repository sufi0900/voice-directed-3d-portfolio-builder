-- Metering remains server-controlled; callers cannot read or modify counters directly.
create table if not exists public.visitor_agent_meter (
  slug text not null,
  visitor_hash text not null,
  usage_day date not null,
  kind text not null check (kind in ('voice', 'text')),
  uses integer not null default 0,
  primary key (slug, visitor_hash, usage_day, kind)
);
alter table public.visitor_agent_meter enable row level security;

create or replace function public.claim_visitor_agent_use(p_slug text, p_hash text, p_kind text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer; v_total integer; v_limit integer;
begin
  if p_kind not in ('voice','text') or p_hash !~ '^[0-9a-f]{64}$' or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then return false; end if;
  if not exists (select 1 from public.project_publications where slug = p_slug and superseded_at is null
    and document #>> '{visitor,enabled}' = 'true'
    and (coalesce(document #>> '{opportunity,status}', 'canonical') = 'canonical' or document #>> '{opportunity,visibility}' = 'public')) then return false; end if;
  -- Serializes all claims to this slug/day, including new visitors; daily cap is atomic.
  perform pg_advisory_xact_lock(hashtextextended(p_slug || current_date::text || p_kind, 0));
  v_limit := case when p_kind = 'voice' then 4 else 25 end;
  select uses into v_count from public.visitor_agent_meter where slug=p_slug and visitor_hash=p_hash and usage_day=current_date and kind=p_kind;
  if coalesce(v_count,0) >= v_limit then return false; end if;
  select coalesce(sum(uses),0) into v_total from public.visitor_agent_meter where slug=p_slug and usage_day=current_date and kind=p_kind;
  if v_total >= (case when p_kind='voice' then 60 else 600 end) then return false; end if;
  insert into public.visitor_agent_meter(slug,visitor_hash,usage_day,kind,uses) values(p_slug,p_hash,current_date,p_kind,1)
  on conflict (slug,visitor_hash,usage_day,kind) do update set uses=visitor_agent_meter.uses+1;
  return true;
end; $$;
revoke all on function public.claim_visitor_agent_use(text,text,text) from public;
grant execute on function public.claim_visitor_agent_use(text,text,text) to service_role;
