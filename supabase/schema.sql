-- MarketSphereGroup Database Schema
-- Run this in Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'provider', 'admin')),
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Categories are public"
  on public.categories for select using (true);

create policy "Admins manage categories"
  on public.categories for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Providers
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  business_name text not null,
  description text,
  logo_url text,
  location text,
  contact_email text,
  contact_phone text,
  gallery_urls text[] default '{}',
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.providers enable row level security;

create policy "Approved providers are public"
  on public.providers for select using (
    status = 'approved'
    or user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Providers can insert own listing"
  on public.providers for insert with check (auth.uid() = user_id);

create policy "Providers can update own listing"
  on public.providers for update using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete providers"
  on public.providers for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Provider services
create table if not exists public.provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade not null,
  category_id uuid references public.categories(id),
  title text not null,
  description text
);

alter table public.provider_services enable row level security;

create policy "Services viewable for approved providers"
  on public.provider_services for select using (
    exists (
      select 1 from public.providers p
      where p.id = provider_id
      and (p.status = 'approved' or p.user_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
    )
  );

create policy "Providers manage own services"
  on public.provider_services for all using (
    exists (select 1 from public.providers where id = provider_id and user_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Enquiries
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  provider_id uuid references public.providers(id) on delete cascade not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  created_at timestamptz default now()
);

alter table public.enquiries enable row level security;

create policy "Customers see own enquiries"
  on public.enquiries for select using (
    customer_id = auth.uid()
    or exists (
      select 1 from public.providers p
      where p.id = provider_id and p.user_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Customers can create enquiries"
  on public.enquiries for insert with check (auth.uid() = customer_id);

create policy "Providers and admins update enquiries"
  on public.enquiries for update using (
    exists (select 1 from public.providers p where p.id = provider_id and p.user_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Favorites
create table if not exists public.favorites (
  customer_id uuid references public.profiles(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (customer_id, provider_id)
);

alter table public.favorites enable row level security;

create policy "Users manage own favorites"
  on public.favorites for all using (auth.uid() = customer_id);

-- Testimonials
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  content text not null,
  service_type text,
  rating int check (rating >= 1 and rating <= 5),
  approved boolean default false,
  created_at timestamptz default now()
);

alter table public.testimonials enable row level security;

create policy "Approved testimonials are public"
  on public.testimonials for select using (
    approved = true
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins manage testimonials"
  on public.testimonials for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Site content
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table public.site_content enable row level security;

create policy "Site content is public"
  on public.site_content for select using (true);

create policy "Admins manage site content"
  on public.site_content for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Contact form messages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  created_at timestamptz default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can submit contact messages"
  on public.contact_messages for insert with check (true);

create policy "Admins read contact messages"
  on public.contact_messages for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins update contact messages"
  on public.contact_messages for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Storage buckets (run in Supabase dashboard or via API)
-- Create buckets: provider-logos, provider-gallery, avatars (all public read)

-- Seed categories
insert into public.categories (name, slug, description, icon, sort_order) values
  ('Youth Empowerment', 'youth-empowerment', 'Harnessing the potential of youths and young professionals across Botswana.', 'users', 1),
  ('Academic Tuition', 'academic-tuition', 'Flexible packages for school-going and out-of-school learners to upgrade their grades.', 'graduation-cap', 2),
  ('Platform Marketing', 'platform-marketing', 'Powerful apps for advertisements with fast and broader mileage.', 'megaphone', 3),
  ('Real Estate Consultancy', 'real-estate', 'Helping customers achieve their property needs across the country.', 'building', 4),
  ('Entrepreneurship Development', 'entrepreneurship', 'Opportunities fostering entrepreneurship and reducing unemployment.', 'lightbulb', 5),
  ('Music Education', 'music-education', 'Basic music education and creative development.', 'music', 6),
  ('IT Services', 'it-services', 'Basic IT services and digital solutions.', 'monitor', 7),
  ('Farming Practices', 'farming', 'Basic farming practices and agricultural guidance.', 'sprout', 8)
on conflict (slug) do nothing;

-- Seed testimonials
insert into public.testimonials (client_name, content, service_type, rating, approved) values
  ('Thabo M.', 'Market Sphere Group helped me find a reliable tutor for my children. Professional and responsive throughout.', 'Academic Tuition', 5, true),
  ('Keabetswe R.', 'Their real estate consultancy made buying our first home in Gaborone straightforward and stress-free.', 'Real Estate', 5, true),
  ('David K.', 'The entrepreneurship training opened doors I never knew existed. Highly recommend their programs.', 'Entrepreneurship', 5, true),
  ('Amanda S.', 'Youth empowerment programs gave our community centre the structure and mentorship we needed.', 'Youth Empowerment', 5, true);
