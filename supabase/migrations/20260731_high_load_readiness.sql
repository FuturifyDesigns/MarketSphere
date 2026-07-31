-- High-load readiness: feed indexes, review aggregates, write rate limits.
-- Safe to re-run. Skips sections whose base tables are missing.
--
-- If showcase_listings does not exist yet, run first (in order):
--   20260725_showcase_listings_hub.sql
--   20260726_showcase_listings_available.sql
--   20260726_showcase_listings_owner_contacts.sql
--   20260727_showcase_deal_type_sale_rent.sql
-- then re-run this file.

-- ---------------------------------------------------------------------------
-- 1) Showcase feed indexes (requires showcase_listings / showcase_columns)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.showcase_listings') is not null then
    execute $i$
      create index if not exists showcase_listings_feed_idx
        on public.showcase_listings (status, featured desc, sort_order, created_at desc)
    $i$;
    execute $i$
      create index if not exists showcase_listings_column_feed_idx
        on public.showcase_listings (column_id, status, featured desc, sort_order, created_at desc)
    $i$;
  end if;

  if to_regclass('public.showcase_columns') is not null then
    execute $i$
      create index if not exists showcase_columns_active_sort_idx
        on public.showcase_columns (active, sort_order)
        where active = true
    $i$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Approved reviews: partial index + aggregate RPC
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.provider_reviews') is null then
    raise notice 'Skipping provider review scale objects: public.provider_reviews missing';
    return;
  end if;

  execute $i$
    create index if not exists provider_reviews_approved_provider_idx
      on public.provider_reviews (provider_id)
      where approved = true
  $i$;

  execute $f$
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
    as $body$
      select
        r.provider_id,
        round(avg(r.rating)::numeric, 2) as average_rating,
        count(*)::bigint as review_count
      from public.provider_reviews r
      where r.approved = true
        and r.provider_id = any (p_ids)
      group by r.provider_id;
    $body$
  $f$;

  execute 'revoke all on function public.provider_review_stats(uuid[]) from public';
  execute 'grant execute on function public.provider_review_stats(uuid[]) to anon, authenticated';

  execute $f$
    create or replace function public.enforce_review_rate_limit()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $body$
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
    $body$
  $f$;

  drop trigger if exists enforce_review_rate_limit on public.provider_reviews;
  create trigger enforce_review_rate_limit
    before insert on public.provider_reviews
    for each row
    execute function public.enforce_review_rate_limit();
end $$;

-- ---------------------------------------------------------------------------
-- 3) Hub counts without shipping every listing id to the client
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.showcase_listings') is null then
    raise notice 'Skipping showcase_published_counts: public.showcase_listings missing';
    return;
  end if;

  execute $f$
    create or replace function public.showcase_published_counts()
    returns table (column_id uuid, listing_count bigint)
    language sql
    stable
    security invoker
    set search_path = public
    as $body$
      select l.column_id, count(*)::bigint as listing_count
      from public.showcase_listings l
      where l.status = 'published'
      group by l.column_id;
    $body$
  $f$;

  execute 'revoke all on function public.showcase_published_counts() from public';
  execute 'grant execute on function public.showcase_published_counts() to anon, authenticated';
end $$;

-- ---------------------------------------------------------------------------
-- 4) Notifications: unread lookup helper index
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.notifications') is not null then
    execute $i$
      create index if not exists notifications_user_unread_idx
        on public.notifications (user_id, created_at desc)
        where read_at is null
    $i$;
  else
    raise notice 'Skipping notifications index: public.notifications missing';
  end if;
end $$;
