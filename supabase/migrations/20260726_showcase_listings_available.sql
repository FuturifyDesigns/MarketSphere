-- Availability flag for showcase listings (Sold / Rented / Closed, etc.)
alter table public.showcase_listings
  add column if not exists available boolean not null default true;

comment on column public.showcase_listings.available is
  'Whether the listing is still open (true) or closed/sold/rented/etc (false), relative to deal_type.';
