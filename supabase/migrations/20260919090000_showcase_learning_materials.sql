-- Showcase learning materials: admin-uploaded PDFs/Word docs/notes per column or listing.

create table if not exists public.showcase_learning_materials (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.showcase_columns(id) on delete cascade,
  listing_id uuid references public.showcase_listings(id) on delete set null,
  title text not null,
  description text,
  file_url text not null,
  file_name text,
  file_type text,
  file_size bigint,
  active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists showcase_learning_materials_column_idx
  on public.showcase_learning_materials(column_id, active, sort_order, created_at desc);

create index if not exists showcase_learning_materials_listing_idx
  on public.showcase_learning_materials(listing_id, active, sort_order, created_at desc);

alter table public.showcase_learning_materials enable row level security;

drop policy if exists "Public read active showcase learning materials" on public.showcase_learning_materials;
create policy "Public read active showcase learning materials"
  on public.showcase_learning_materials for select
  using (active = true or public.is_admin());

drop policy if exists "Admins manage showcase learning materials" on public.showcase_learning_materials;
create policy "Admins manage showcase learning materials"
  on public.showcase_learning_materials for all
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'showcase-materials',
  'showcase-materials',
  true,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read showcase materials" on storage.objects;
create policy "Public read showcase materials"
  on storage.objects for select
  using (bucket_id = 'showcase-materials');

drop policy if exists "Admins upload showcase materials" on storage.objects;
create policy "Admins upload showcase materials"
  on storage.objects for insert
  with check (bucket_id = 'showcase-materials' and public.is_admin());

drop policy if exists "Admins update showcase materials" on storage.objects;
create policy "Admins update showcase materials"
  on storage.objects for update
  using (bucket_id = 'showcase-materials' and public.is_admin());

drop policy if exists "Admins delete showcase materials" on storage.objects;
create policy "Admins delete showcase materials"
  on storage.objects for delete
  using (bucket_id = 'showcase-materials' and public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'showcase_learning_materials'
  ) then
    alter publication supabase_realtime add table public.showcase_learning_materials;
  end if;
end $$;
