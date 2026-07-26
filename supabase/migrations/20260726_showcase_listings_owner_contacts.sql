-- Owner contact details for showcase listings (property / listing owners)
alter table public.showcase_listings
  add column if not exists owner_name text,
  add column if not exists owner_phone text,
  add column if not exists owner_email text;

comment on column public.showcase_listings.owner_name is 'Property/listing owner display name';
comment on column public.showcase_listings.owner_phone is 'Property/listing owner phone';
comment on column public.showcase_listings.owner_email is 'Property/listing owner email';
