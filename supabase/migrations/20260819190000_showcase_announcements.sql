-- Market Sphere Showcase: column-targeted announcements, job openings, advertisements, and notices
-- Applied remotely; kept in repo for source control.

create table if not exists public.showcase_announcements (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references public.showcase_columns(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'general'
    check (category in ('job', 'advertisement', 'event', 'notice', 'general')),
  badge text,
  image_url text,
  link_url text,
  link_label text,
  contact_phone text,
  contact_email text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  pinned boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists showcase_announcements_column_id_idx on public.showcase_announcements(column_id);
create index if not exists showcase_announcements_active_idx on public.showcase_announcements(active, starts_at, expires_at);
create index if not exists showcase_announcements_pinned_sort_idx on public.showcase_announcements(pinned, sort_order, created_at desc);

alter table public.showcase_announcements enable row level security;

drop policy if exists "Public read active showcase announcements" on public.showcase_announcements;
create policy "Public read active showcase announcements"
  on public.showcase_announcements for select
  using (
    (
      active = true
      and starts_at <= now()
      and (expires_at is null or expires_at > now())
    )
    or public.is_admin()
  );

drop policy if exists "Admins manage showcase announcements" on public.showcase_announcements;
create policy "Admins manage showcase announcements"
  on public.showcase_announcements for all
  using (public.is_admin())
  with check (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'showcase_announcements'
  ) then
    alter publication supabase_realtime add table public.showcase_announcements;
  end if;
end $$;
