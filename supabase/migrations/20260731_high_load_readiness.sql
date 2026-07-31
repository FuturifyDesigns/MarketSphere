-- High-load readiness: feed indexes, review aggregates, write rate limits.

-- ---------------------------------------------------------------------------
-- 1) Showcase feed indexes (status + featured sort used by Home / Showcase / app)
-- ---------------------------------------------------------------------------
create index if not exists showcase_listings_feed_idx
  on public.showcase_listings (status, featured desc, sort_order, created_at desc);

create index if not exists showcase_listings_column_feed_idx
  on public.showcase_listings (column_id, status, featured desc, sort_order, created_at desc);

create index if not exists showcase_columns_active_sort_idx
  on public.showcase_columns (active, sort_order)
  where active = true;

-- ---------------------------------------------------------------------------
-- 2) Approved reviews: partial index + aggregate RPC (avoid pulling every row)
-- ---------------------------------------------------------------------------
create index if not exists provider_reviews_approved_provider_idx
  on public.provider_reviews (provider_id)
  where approved = true;

create or replace function public.provider_review_stats(p_ids uuid[])
returns table (
  provider_id uuid,
  average_rating numeric,
  review_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    r.provider_id,
    round(avg(r.rating)::numeric, 2) as average_rating,
    count(*)::bigint as review_count
  from public.provider_reviews r
  where r.approved = true
    and r.provider_id = any (p_ids)
  group by r.provider_id;
$$;

revoke all on function public.provider_review_stats(uuid[]) from public;
grant execute on function public.provider_review_stats(uuid[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Hub counts without shipping every listing id to the client
-- ---------------------------------------------------------------------------
create or replace function public.showcase_published_counts()
returns table (column_id uuid, listing_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select l.column_id, count(*)::bigint as listing_count
  from public.showcase_listings l
  where l.status = 'published'
  group by l.column_id;
$$;

revoke all on function public.showcase_published_counts() from public;
grant execute on function public.showcase_published_counts() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Write rate limits: provider reviews (testimonials already limited in RPC)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_review_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent int;
begin
  if auth.uid() is null or new.customer_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  select count(*)::int
    into v_recent
  from public.provider_reviews
  where customer_id = auth.uid()
    and created_at > now() - interval '10 minutes';

  if v_recent >= 8 then
    raise exception 'Too many reviews. Please wait a few minutes.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_review_rate_limit on public.provider_reviews;
create trigger enforce_review_rate_limit
  before insert on public.provider_reviews
  for each row
  execute function public.enforce_review_rate_limit();

-- ---------------------------------------------------------------------------
-- 5) Notifications: unread lookup helper index
-- ---------------------------------------------------------------------------
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;
