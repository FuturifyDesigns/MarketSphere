-- Promote admin@marketspheregroup.com to admin on signup; remove imcalledsammy auto-admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  assigned_role text;
begin
  requested_role := lower(coalesce(new.raw_user_meta_data->>'role', 'customer'));

  if requested_role in ('customer', 'provider') then
    assigned_role := requested_role;
  else
    assigned_role := 'customer';
  end if;

  if lower(coalesce(new.email, '')) = lower('admin@marketspheregroup.com') then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    assigned_role
  );
  return new;
end;
$$;

-- Role updates must bypass protect_profile_columns (requires auth.uid admin session).
alter table public.profiles disable trigger protect_profile_columns;

update public.profiles
set role = 'admin'
where lower(email) = lower('admin@marketspheregroup.com');

update public.profiles
set role = 'customer'
where lower(email) = lower('imcalledsammy@gmail.com')
  and role = 'admin';

alter table public.profiles enable trigger protect_profile_columns;
