-- Google/OAuth signup cannot pass a role to handle_new_user, so every OAuth
-- account is created as 'customer'. The clients then upgrade the profile, but
-- protect_profile_columns silently reverted the change whenever the
-- 20260725 migration had not been applied — the update succeeded with no error
-- and the user landed on the customer dashboard.
--
-- This replaces the ad-hoc client-side UPDATE with an explicit RPC, and teaches
-- the guard trigger to honour it via a request-scoped setting.

-- ---------------------------------------------------------------------------
-- 1) Guard trigger: allow customer -> provider, plus the RPC escape hatch
-- ---------------------------------------------------------------------------
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
    -- set_config(..., true) is transaction-local, so this cannot leak between
    -- requests on a pooled connection.
    if coalesce(current_setting('app.allow_role_self_upgrade', true), 'off') = 'on'
       and old.role = 'customer'
       and new.role = 'provider' then
      null; -- permitted self-service upgrade
    elsif old.role = 'customer' and new.role = 'provider' then
      null; -- keep direct upgrades working for existing clients
    else
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

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- 2) RPC: claim the provider role for the calling user
-- ---------------------------------------------------------------------------
-- Returns the role the profile ends up with, so callers can route on the real
-- stored value instead of assuming the write took effect.
create or replace function public.claim_provider_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select role into v_role from public.profiles where id = v_uid;

  if v_role is null then
    raise exception 'Profile not found';
  end if;

  -- Only customers may self-upgrade. Admins and existing providers are returned
  -- unchanged so this can never be used to escalate or demote.
  if v_role <> 'customer' then
    return v_role;
  end if;

  perform set_config('app.allow_role_self_upgrade', 'on', true);
  update public.profiles set role = 'provider' where id = v_uid;

  select role into v_role from public.profiles where id = v_uid;
  return v_role;
end;
$$;

revoke all on function public.claim_provider_role() from public;
grant execute on function public.claim_provider_role() to authenticated;
