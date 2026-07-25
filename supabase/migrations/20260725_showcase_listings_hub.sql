-- Market Sphere Showcase: admin-managed advertising columns + listings
-- Applied remotely; kept in repo for source control.

create table if not exists public.showcase_columns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text,
  description text,
  icon text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.showcase_listings (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.showcase_columns(id) on delete cascade,
  title text not null,
  summary text,
  description text,
  location text,
  price_label text,
  deal_type text not null default 'other'
    check (deal_type in ('sale', 'rent', 'opportunity', 'project', 'service', 'other')),
  image_urls text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists showcase_listings_column_id_idx on public.showcase_listings(column_id);
create index if not exists showcase_listings_status_idx on public.showcase_listings(status);
create index if not exists showcase_columns_active_sort_idx on public.showcase_columns(active, sort_order);

alter table public.showcase_columns enable row level security;
alter table public.showcase_listings enable row level security;

drop policy if exists "Public read active showcase columns" on public.showcase_columns;
create policy "Public read active showcase columns"
  on public.showcase_columns for select
  using (active = true or public.is_admin());

drop policy if exists "Admins manage showcase columns" on public.showcase_columns;
create policy "Admins manage showcase columns"
  on public.showcase_columns for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public read published showcase listings" on public.showcase_listings;
create policy "Public read published showcase listings"
  on public.showcase_listings for select
  using (status = 'published' or public.is_admin());

drop policy if exists "Admins manage showcase listings" on public.showcase_listings;
create policy "Admins manage showcase listings"
  on public.showcase_listings for all
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'showcase-listings',
  'showcase-listings',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read showcase listing images" on storage.objects;
create policy "Public read showcase listing images"
  on storage.objects for select
  using (bucket_id = 'showcase-listings');

drop policy if exists "Admins upload showcase listing images" on storage.objects;
create policy "Admins upload showcase listing images"
  on storage.objects for insert
  with check (bucket_id = 'showcase-listings' and public.is_admin());

drop policy if exists "Admins update showcase listing images" on storage.objects;
create policy "Admins update showcase listing images"
  on storage.objects for update
  using (bucket_id = 'showcase-listings' and public.is_admin());

drop policy if exists "Admins delete showcase listing images" on storage.objects;
create policy "Admins delete showcase listing images"
  on storage.objects for delete
  using (bucket_id = 'showcase-listings' and public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'showcase_columns'
  ) then
    alter publication supabase_realtime add table public.showcase_columns;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'showcase_listings'
  ) then
    alter publication supabase_realtime add table public.showcase_listings;
  end if;
end $$;

insert into public.showcase_columns (slug, title, tagline, description, icon, sort_order)
values
  ('real-estate', 'Real Estate', 'Properties for sale and rent across Botswana.', 'Advertise homes, plots, and commercial spaces Market Sphere is helping clients buy or rent.', 'building', 10),
  ('youth-empowerment', 'Youth Empowerment', 'Projects that unlock youth potential.', 'Highlight youth-centred projects, mentorship programmes, and community initiatives.', 'users', 20),
  ('farming', 'Farming Practices', 'Agricultural opportunities and produce.', 'Share farming opportunities, produce, and basic agricultural practice offerings.', 'sprout', 30),
  ('entrepreneurship', 'Entrepreneurship', 'Enterprise opportunities and support.', 'Promote entrepreneurship programmes and business opportunities.', 'lightbulb', 40),
  ('academic-tuition', 'Academic Tuition', 'Learning packages and tutoring.', 'Advertise tuition packages for school-going and out-of-school learners.', 'graduation-cap', 50),
  ('platform-marketing', 'Platform Marketing', 'Reach more customers, faster.', 'Promote marketing campaigns and advertising packages.', 'megaphone', 60),
  ('music-education', 'Music Education', 'Basic music education offerings.', 'Share music education classes and related offerings.', 'music', 70),
  ('career-development', 'Career Development', 'Grow skills. Shape careers.', 'List career development programmes and coaching.', 'briefcase', 80),
  ('it-services', 'Basic IT Services', 'Practical digital support.', 'Advertise basic IT services and digital support offerings.', 'monitor', 90)
on conflict (slug) do nothing;
