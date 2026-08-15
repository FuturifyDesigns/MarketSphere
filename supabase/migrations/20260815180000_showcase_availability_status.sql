-- Explicit availability status so admins can choose Sold or Tenanted
-- (not inferred only from deal_type). Keeps boolean `available` in sync.

alter table public.showcase_listings
  add column if not exists availability_status text;

update public.showcase_listings
set availability_status = case
  when available is true then 'available'
  when deal_type = 'sale' then 'sold'
  when deal_type in ('rent', 'sale_rent') then 'tenanted'
  when deal_type = 'opportunity' then 'closed'
  when deal_type = 'project' then 'completed'
  else 'unavailable'
end
where availability_status is null;

alter table public.showcase_listings
  alter column availability_status set default 'available';

alter table public.showcase_listings
  alter column availability_status set not null;

alter table public.showcase_listings
  drop constraint if exists showcase_listings_availability_status_check;

alter table public.showcase_listings
  add constraint showcase_listings_availability_status_check
  check (availability_status in ('available', 'sold', 'tenanted', 'closed', 'completed', 'unavailable'));

comment on column public.showcase_listings.availability_status is
  'Admin-chosen availability: available, sold, tenanted, closed, completed, or unavailable.';

create or replace function public.sync_showcase_listing_available()
returns trigger
language plpgsql
as $$
begin
  if new.availability_status is null then
    new.availability_status := case when coalesce(new.available, true) then 'available' else 'unavailable' end;
  end if;
  new.available := (new.availability_status = 'available');
  return new;
end;
$$;

drop trigger if exists sync_showcase_listing_available on public.showcase_listings;
create trigger sync_showcase_listing_available
  before insert or update of availability_status, available
  on public.showcase_listings
  for each row
  execute function public.sync_showcase_listing_available();

-- Ensure existing rows have available synced
update public.showcase_listings
set available = (availability_status = 'available')
where available is distinct from (availability_status = 'available');
