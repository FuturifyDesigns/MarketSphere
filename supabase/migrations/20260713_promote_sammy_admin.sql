-- Auto-promote imcalledsammy@gmail.com to admin on signup, and update if account already exists.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    case
      when lower(new.email) = lower('imcalledsammy@gmail.com') then 'admin'
      else coalesce(new.raw_user_meta_data->>'role', 'customer')
    end
  );
  return new;
end;
$$ language plpgsql security definer;

update public.profiles
set role = 'admin'
where lower(email) = lower('imcalledsammy@gmail.com');
