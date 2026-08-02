-- Broadcast a notification to every active profile when a listing is newly published.
-- Providers already get enquiry_new via on_enquiry_created_notify (20260314).
-- Local/Realtime clients surface these as OS notifications while the app is reachable;
-- full FCM fan-out remains a follow-up once Firebase is wired.

create or replace function public.notify_new_published_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient record;
  link_path text;
  body_text text;
begin
  if new.status is distinct from 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;

  link_path := '/showcase/listing/' || new.id::text;
  body_text := coalesce(nullif(trim(new.title), ''), 'A new showcase listing')
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

  return new;
end;
$$;

comment on function public.notify_new_published_listing() is
  'Notifies every active profile when a showcase listing is newly published.';

drop trigger if exists showcase_listings_notify_new_trg on public.showcase_listings;
create trigger showcase_listings_notify_new_trg
  after insert or update of status on public.showcase_listings
  for each row
  execute function public.notify_new_published_listing();
