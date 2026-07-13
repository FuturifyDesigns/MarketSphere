-- MarketSphereGroup Storage Buckets + Policies
-- Run AFTER schema.sql in Supabase SQL Editor

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('provider-logos', 'provider-logos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('provider-gallery', 'provider-gallery', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 524288, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for all three buckets
create policy "Public read provider logos"
  on storage.objects for select
  using (bucket_id = 'provider-logos');

create policy "Public read provider gallery"
  on storage.objects for select
  using (bucket_id = 'provider-gallery');

create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users upload/update/delete their own files
create policy "Auth users upload provider logos"
  on storage.objects for insert
  with check (
    bucket_id = 'provider-logos'
    and auth.role() = 'authenticated'
  );

create policy "Auth users update provider logos"
  on storage.objects for update
  using (
    bucket_id = 'provider-logos'
    and auth.role() = 'authenticated'
  );

create policy "Auth users delete provider logos"
  on storage.objects for delete
  using (
    bucket_id = 'provider-logos'
    and auth.role() = 'authenticated'
  );

create policy "Auth users upload provider gallery"
  on storage.objects for insert
  with check (
    bucket_id = 'provider-gallery'
    and auth.role() = 'authenticated'
  );

create policy "Auth users update provider gallery"
  on storage.objects for update
  using (
    bucket_id = 'provider-gallery'
    and auth.role() = 'authenticated'
  );

create policy "Auth users delete provider gallery"
  on storage.objects for delete
  using (
    bucket_id = 'provider-gallery'
    and auth.role() = 'authenticated'
  );

create policy "Auth users upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

create policy "Auth users update avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

create policy "Auth users delete avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );
