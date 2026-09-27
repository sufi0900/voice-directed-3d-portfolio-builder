-- One token starts one voice session. Five starts per day was exhausted by normal
-- onboarding retries and manual stop/restart testing. Keep an atomic per-owner
-- limit while allowing a practical number of sessions for an active interview.
create or replace function public.claim_vox_interview_use()
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uses integer;
begin
  if auth.uid() is null then return false; end if;
  insert into public.vox_interview_meter(owner_id, usage_day, uses)
  values (auth.uid(), current_date, 1)
  on conflict (owner_id, usage_day) do update
    set uses = public.vox_interview_meter.uses + 1
    where public.vox_interview_meter.uses < 20
  returning uses into v_uses;
  return v_uses is not null;
end; $$;
revoke all on function public.claim_vox_interview_use() from public, anon;
grant execute on function public.claim_vox_interview_use() to authenticated;
