-- Broadcast new-listing pushes to guest devices via FCM topic `new_listings`.
-- Signed-in users still get per-profile notification rows (and their own FCM fan-out).
-- Guests subscribe to the topic in the mobile app when not signed in.

create or replace function public.notify_new_published_listing()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
declare
  recipient record;
  link_path text;
  body_text text;
  listing_title text;
begin
  if new.status is distinct from 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;

  link_path := '/showcase/listing/' || new.id::text;
  listing_title := coalesce(nullif(trim(new.title), ''), 'A new showcase listing');
  body_text := listing_title
    || case
         when new.location is not null and length(trim(new.location)) > 0
           then ' — ' || trim(new.location)
         else ''
       end;

  for recipient in
    select p.id
    from public.profiles p
    where p.banned_at is null
  loop
    perform public.notify_user(
      recipient.id,
      'listing_new',
      'New listing on Market Sphere',
      body_text,
      link_path,
      jsonb_build_object(
        'listing_id', new.id,
        'location', new.location,
        'column_id', new.column_id
      )
    );
  end loop;

  -- Guest devices (no account) listen on FCM topic `new_listings`.
  perform net.http_post(
    url := 'https://creaxptcrptygvmtioub.supabase.co/functions/v1/push-on-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'broadcast_topic', 'new_listings',
      'record', jsonb_build_object(
        'id', new.id::text,
        'user_id', '00000000-0000-0000-0000-000000000000',
        'type', 'listing_new',
        'title', 'New listing on Market Sphere',
        'body', body_text,
        'link', link_path
      )
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

comment on function public.notify_new_published_listing() is
  'Notifies every active profile and FCM topic new_listings (guests) when a listing is published.';
