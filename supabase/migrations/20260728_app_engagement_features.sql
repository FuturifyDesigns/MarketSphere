-- App engagement: reviews, listing favourites/alerts, device tokens, listing change notifies
-- Apply via Supabase SQL editor or CLI migrate.

-- ---------------------------------------------------------------------------
-- Providers: Market Sphere Approved stamp + optional geo for near-you
-- ---------------------------------------------------------------------------
alter table public.providers
  add column if not exists ms_approved boolean not null default false,
  add column if not exists verified_at timestamptz,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

update public.providers
set
  ms_approved = true,
  verified_at = coalesce(verified_at, now())
where status = 'approved'
  and ms_approved = false;

create or replace function public.providers_mark_approved_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    new.ms_approved := true;
    new.verified_at := coalesce(new.verified_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists providers_mark_approved_stamp_trg on public.providers;
create trigger providers_mark_approved_stamp_trg
  before update of status on public.providers
  for each row
  execute function public.providers_mark_approved_stamp();

-- ---------------------------------------------------------------------------
-- Provider reviews
-- ---------------------------------------------------------------------------
create table if not exists public.provider_reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (provider_id, customer_id)
);

create index if not exists provider_reviews_provider_id_idx
  on public.provider_reviews (provider_id, created_at desc);

alter table public.provider_reviews enable row level security;

drop policy if exists "Public read approved provider reviews" on public.provider_reviews;
create policy "Public read approved provider reviews"
  on public.provider_reviews for select
  using (
    approved = true
    or auth.uid() = customer_id
    or public.is_admin()
  );

drop policy if exists "Customers insert own provider reviews" on public.provider_reviews;
create policy "Customers insert own provider reviews"
  on public.provider_reviews for insert
  with check (
    auth.uid() = customer_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.banned_at is null
    )
  );

drop policy if exists "Customers update own provider reviews" on public.provider_reviews;
create policy "Customers update own provider reviews"
  on public.provider_reviews for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

drop policy if exists "Customers delete own provider reviews" on public.provider_reviews;
create policy "Customers delete own provider reviews"
  on public.provider_reviews for delete
  using (auth.uid() = customer_id);

drop policy if exists "Admins manage provider reviews" on public.provider_reviews;
create policy "Admins manage provider reviews"
  on public.provider_reviews for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Listing favourites
-- ---------------------------------------------------------------------------
create table if not exists public.listing_favorites (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.showcase_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, listing_id)
);

create index if not exists listing_favorites_listing_id_idx
  on public.listing_favorites (listing_id);

alter table public.listing_favorites enable row level security;

drop policy if exists "Users manage own listing favorites" on public.listing_favorites;
create policy "Users manage own listing favorites"
  on public.listing_favorites for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- ---------------------------------------------------------------------------
-- Listing alerts (notify me)
-- ---------------------------------------------------------------------------
create table if not exists public.listing_alerts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.showcase_listings(id) on delete cascade,
  notify_price boolean not null default true,
  notify_availability boolean not null default true,
  created_at timestamptz not null default now(),
  unique (customer_id, listing_id)
);

create index if not exists listing_alerts_listing_id_idx
  on public.listing_alerts (listing_id);

alter table public.listing_alerts enable row level security;

drop policy if exists "Users manage own listing alerts" on public.listing_alerts;
create policy "Users manage own listing alerts"
  on public.listing_alerts for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- ---------------------------------------------------------------------------
-- Device tokens (FCM-ready)
-- ---------------------------------------------------------------------------
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null default 'android' check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists device_tokens_user_id_idx on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;

drop policy if exists "Users manage own device tokens" on public.device_tokens;
create policy "Users manage own device tokens"
  on public.device_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Notify watchers when listing price / availability changes
-- ---------------------------------------------------------------------------
create or replace function public.notify_listing_alert_watchers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  watcher record;
  price_changed boolean;
  availability_changed boolean;
  link_path text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  price_changed := old.price_label is distinct from new.price_label;
  availability_changed := old.available is distinct from new.available;

  if not price_changed and not availability_changed then
    return new;
  end if;

  if new.status is distinct from 'published' then
    return new;
  end if;

  link_path := '/showcase/listing/' || new.id::text;

  for watcher in
    select la.customer_id, la.notify_price, la.notify_availability
    from public.listing_alerts la
    where la.listing_id = new.id
  loop
    if price_changed and watcher.notify_price then
      perform public.notify_user(
        watcher.customer_id,
        'listing_price_changed',
        'Price update',
        coalesce(new.title, 'A saved listing') || ' price is now ' || coalesce(new.price_label, 'updated'),
        link_path,
        jsonb_build_object('listing_id', new.id, 'price_label', new.price_label)
      );
    end if;

    if availability_changed and watcher.notify_availability then
      perform public.notify_user(
        watcher.customer_id,
        'listing_availability',
        case when new.available then 'Now available' else 'Availability changed' end,
        coalesce(new.title, 'A saved listing') ||
          case when new.available then ' is available again.' else ' availability was updated.' end,
        link_path,
        jsonb_build_object('listing_id', new.id, 'available', new.available)
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists showcase_listings_alert_watchers_trg on public.showcase_listings;
create trigger showcase_listings_alert_watchers_trg
  after update of price_label, available, status on public.showcase_listings
  for each row
  execute function public.notify_listing_alert_watchers();

-- ---------------------------------------------------------------------------
-- Notify users who favourited a provider when a matching new listing publishes
-- (lightweight “for you” signal — uses listing location vs provider location)
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_published_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient record;
  link_path text;
begin
  if new.status is distinct from 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;

  link_path := '/showcase/listing/' || new.id::text;

  -- Fans of any provider in same location string (when both set)
  if new.location is not null and length(trim(new.location)) > 0 then
    for recipient in
      select distinct f.customer_id
      from public.favorites f
      join public.providers p on p.id = f.provider_id
      where p.status = 'approved'
        and p.location is not null
        and lower(p.location) like '%' || lower(trim(new.location)) || '%'
    loop
      perform public.notify_user(
        recipient.customer_id,
        'listing_new',
        'New listing near your interests',
        coalesce(new.title, 'A new showcase listing') || ' was published in ' || new.location,
        link_path,
        jsonb_build_object('listing_id', new.id, 'location', new.location)
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists showcase_listings_notify_new_trg on public.showcase_listings;
create trigger showcase_listings_notify_new_trg
  after insert or update of status on public.showcase_listings
  for each row
  execute function public.notify_new_published_listing();

-- ---------------------------------------------------------------------------
-- Provider near-you: when a provider is approved, notify customers who listed
-- that city in listing_alerts… (no city prefs table) — notify users who have
-- favourited any provider already (engagement) with a soft “new verified provider”
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_approved_provider()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient record;
begin
  if new.status is distinct from 'approved' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'approved' then
    return new;
  end if;

  for recipient in
    select distinct f.customer_id
    from public.favorites f
  loop
    perform public.notify_user(
      recipient.customer_id,
      'provider_nearby',
      'New verified provider',
      coalesce(new.business_name, 'A provider') ||
        case
          when new.location is not null then ' joined Market Sphere in ' || new.location
          else ' is now verified on Market Sphere'
        end,
      '/providers/' || new.id::text,
      jsonb_build_object('provider_id', new.id, 'location', new.location)
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists providers_notify_approved_trg on public.providers;
create trigger providers_notify_approved_trg
  after insert or update of status on public.providers
  for each row
  execute function public.notify_new_approved_provider();

-- Realtime (best-effort; ignore if already added)
do $$
begin
  begin
    alter publication supabase_realtime add table public.listing_favorites;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.listing_alerts;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;
