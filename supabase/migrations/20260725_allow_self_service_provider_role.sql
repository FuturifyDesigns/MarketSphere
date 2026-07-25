-- Allow a signed-in customer to self-upgrade to provider (OAuth / Google signup intent).
-- Still blocks any change involving admin, and blocks provider→customer demotion by non-admins.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    if not (old.role = 'customer' and new.role = 'provider') then
      new.role := old.role;
    end if;
  end if;

  new.email := old.email;
  new.banned_at := old.banned_at;
  new.ban_reason := old.ban_reason;
  new.banned_by := old.banned_by;
  return new;
end;
$$;
