-- Allow showcase listings to be both for sale and for rent
alter table public.showcase_listings
  drop constraint if exists showcase_listings_deal_type_check;

alter table public.showcase_listings
  add constraint showcase_listings_deal_type_check
  check (deal_type in ('sale', 'rent', 'sale_rent', 'opportunity', 'project', 'service', 'other'));
