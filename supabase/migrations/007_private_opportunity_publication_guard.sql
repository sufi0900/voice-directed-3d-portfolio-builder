-- Apply after 006. Public URLs may show canonical projects or explicitly public variants.
-- A noindex tag is not authorization: private/shared variants must not be readable by anonymous visitors.
drop policy if exists "visitors read live publications" on public.project_publications;
create policy "visitors read live public publications" on public.project_publications
  for select using (
    superseded_at is null and (
      coalesce(document #>> '{opportunity,status}', 'canonical') = 'canonical'
      or document #>> '{opportunity,visibility}' = 'public'
    )
  );
