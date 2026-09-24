-- Add "currently on offer" as an explicit availability choice.
-- on_offer stays open (available = true), unlike sold/tenanted.

alter table public.showcase_listings
  drop constraint if exists showcase_listings_availability_status_check;

alter table public.showcase_listings
  add constraint showcase_listings_availability_status_check
  check (
    availability_status in (
      'available',
      'on_offer',
      'sold',
      'tenanted',
      'closed',
      'completed',
      'unavailable'
    )
  );

comment on column public.showcase_listings.availability_status is
  'Admin-chosen availability: available, on_offer, sold, tenanted, closed, completed, or unavailable.';

create or replace function public.sync_showcase_listing_available()
returns trigger
language plpgsql
as $$
begin
  if new.availability_status is null then
    new.availability_status := case
      when coalesce(new.available, true) then 'available'
      else 'unavailable'
    end;
  end if;
  -- Open statuses that still accept interest
  new.available := new.availability_status in ('available', 'on_offer');
  return new;
end;
$$;

update public.showcase_listings
set available = (availability_status in ('available', 'on_offer'))
where available is distinct from (availability_status in ('available', 'on_offer'));
