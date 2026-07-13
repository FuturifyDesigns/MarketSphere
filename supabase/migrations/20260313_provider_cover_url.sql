-- Provider profile cover image (wide banner shown on public listing)
alter table public.providers
  add column if not exists cover_url text;
