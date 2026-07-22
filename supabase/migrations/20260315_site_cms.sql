-- CMS: seed site_content, site-assets bucket, realtime
-- Run in Supabase SQL Editor

-- ---------------------------------------------------------------------------
-- site_content upsert helper (admin only)
-- ---------------------------------------------------------------------------
create or replace function public.admin_upsert_site_content(
  content_key text,
  content_value jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  insert into public.site_content (key, value, updated_at)
  values (content_key, content_value, now())
  on conflict (key) do update
  set value = excluded.value,
      updated_at = now();
end;
$$;

grant execute on function public.admin_upsert_site_content(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime for live site updates
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.site_content;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- site-assets storage bucket (admin-managed marketing images)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read site assets" on storage.objects;
create policy "Public read site assets"
  on storage.objects for select
  using (bucket_id = 'site-assets');

drop policy if exists "Admins upload site assets" on storage.objects;
create policy "Admins upload site assets"
  on storage.objects for insert
  with check (
    bucket_id = 'site-assets'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins update site assets" on storage.objects;
create policy "Admins update site assets"
  on storage.objects for update
  using (
    bucket_id = 'site-assets'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins delete site assets" on storage.objects;
create policy "Admins delete site assets"
  on storage.objects for delete
  using (
    bucket_id = 'site-assets'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Seed defaults (idempotent — only inserts missing keys)
-- ---------------------------------------------------------------------------
insert into public.site_content (key, value)
values
  ('company', '{
    "name": "Market Sphere Group (Pty) Ltd",
    "shortName": "Market Sphere Group",
    "tagline": "Master Your Field for Relevance",
    "registration": "UIN BW00000887185",
    "mission": "Master Your Field for Relevance",
    "vision": "To be a formidable hub for providing timely solutions to the needs of clients, youths and meet Government on the national vision in the development of the country.",
    "overview": "Market Sphere Group (Pty) Ltd is a privately owned company providing professional and socio-economic services and solutions in areas including Entrepreneurship Development, basic music education, Real estate consultancy, career development, academic tuitions, youth empowerment projects and mentorship, platform for mass marketing, and basic farming practice.",
    "headOffice": "Gaborone, Botswana",
    "operationalArea": "Botswana and SADC",
    "businessType": "Service provider and entrepreneurship developments",
    "companyType": "A private limited company",
    "address": "10102 MAFULO House, next to Old Prison Headquarters, Taung Broadhurst, Gaborone, Botswana",
    "email": "info@marketspheregroup.com",
    "phones": ["+267 74013060", "+267 72470917"],
    "coreValues": ["Botho", "Professionalism", "Customer satisfaction", "Innovation", "Excellence", "Empowerment", "Reliability", "Sustainable growth / Unemployment reduction"],
    "areasOfInterest": ["Entrepreneurship training", "Career development", "Basic IT services", "Real estate consulting", "Youth empowerment projects and mentorship", "Music education", "Academic tuitions", "Platform mass marketing", "Basic farming practices"]
  }'::jsonb),
  ('faq', '{
    "hero": {
      "eyebrow": "Help Centre",
      "title": "Questions?\nWe''ve got answers",
      "lead": "Search or browse topics about Market Sphere Group, providers, and how our platform works.",
      "statAnswers": "7",
      "statTopics": "4",
      "statSupport": "24h"
    },
    "categories": ["All", "Platform", "Providers", "Payments", "Company"],
    "items": []
  }'::jsonb),
  ('home', '{
    "hero": {
      "welcomeEyebrow": "Welcome to",
      "titleLine1": "Connect with",
      "titleLine2": "trusted providers",
      "titleLine3": "across Botswana",
      "subcopy": "A professional marketplace linking customers with verified service providers — from tutoring and real estate to youth empowerment and entrepreneurship.",
      "ctaBrowse": "Explore Providers",
      "ctaProvider": "List Your Business"
    },
    "stats": [],
    "marquee": ["Youth Empowerment", "Real Estate", "Academic Tuition", "Entrepreneurship", "Platform Marketing", "Botswana", "SADC", "Master Your Field"],
    "providersSection": {
      "eyebrow": "Our Network",
      "title": "Featured providers",
      "titleEmphasis": "providers",
      "lead": "Browse verified professionals ready to help you master your field.",
      "cta": "Browse all providers",
      "footer": "Discover more categories, locations, and specialists on the full marketplace."
    },
    "vision": {
      "eyebrow": "Our Vision",
      "title": "Master Your Field for Relevance",
      "lead": "To be a formidable hub for providing timely solutions to the needs of clients, youths and meet Government on the national vision in the development of the country."
    }
  }'::jsonb),
  ('contact', '{
    "hero": {
      "eyebrow": "Contact us",
      "title": "Get in touch",
      "titleEmphasis": "with our team",
      "lead": "Questions about providers, partnerships, or your account? Send us a message and we will respond as soon as we can.",
      "responseTime": "We usually reply within one business day."
    }
  }'::jsonb),
  ('about', '{
    "hero": {
      "eyebrow": "About us",
      "title": "Built for relevance",
      "titleEmphasis": "across Botswana",
      "lead": "Master Your Field for Relevance"
    }
  }'::jsonb),
  ('services', '{
    "hero": {
      "eyebrow": "What we offer",
      "title": "Services that move",
      "titleEmphasis": "communities forward",
      "lead": "Explore the service lines Market Sphere Group delivers across Botswana."
    },
    "items": []
  }'::jsonb)
on conflict (key) do nothing;

-- Note: FAQ items and services items are populated from app defaults on first load
-- if empty arrays. Admins can edit via inline CMS on the live site.
