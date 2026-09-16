insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = true,
    file_size_limit = 3145728,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "owners read portfolio media" on storage.objects;
drop policy if exists "owners upload portfolio media" on storage.objects;
drop policy if exists "owners update portfolio media" on storage.objects;
drop policy if exists "owners delete portfolio media" on storage.objects;

create policy "owners read portfolio media"
on storage.objects for select to authenticated
using (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

create policy "owners upload portfolio media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

create policy "owners update portfolio media"
on storage.objects for update to authenticated
using (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
)
with check (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

create policy "owners delete portfolio media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

