-- Normalize phones for uniqueness (digits only, strip leading 0 / regional country codes).
create or replace function public.normalize_phone_digits(p_phone text)
returns text
language plpgsql
immutable
as $$
declare
  d text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if d is null or d = '' then
    return null;
  end if;

  -- Drop a single leading trunk 0 (e.g. 074013060 → 74013060).
  if left(d, 1) = '0' then
    d := substr(d, 2);
  end if;

  -- Strip regional country codes used by the app so "+267 74…" and "74…" match.
  if length(d) >= 10 and d ~ '^(267|264|260|263|27)' then
    d := regexp_replace(d, '^(267|264|260|263|27)', '');
  end if;

  if d = '' or length(d) < 7 then
    return null;
  end if;

  return d;
end;
$$;

revoke all on function public.normalize_phone_digits(text) from public;
grant execute on function public.normalize_phone_digits(text) to anon, authenticated;

-- True when another profile already uses this phone (optional exclude for self-updates).
create or replace function public.phone_already_registered(
  p_phone text,
  p_exclude_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where public.normalize_phone_digits(p.phone) = public.normalize_phone_digits(p_phone)
      and public.normalize_phone_digits(p_phone) is not null
      and (p_exclude_user_id is null or p.id <> p_exclude_user_id)
  );
$$;

revoke all on function public.phone_already_registered(text, uuid) from public;
grant execute on function public.phone_already_registered(text, uuid) to anon, authenticated;

comment on function public.phone_already_registered(text, uuid) is
  'Returns true when another profile already has this phone number. Used to block duplicate phones on signup/profile update.';

-- Enforce uniqueness at write time (covers direct client updates that skip the RPC).
create or replace function public.enforce_unique_profile_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digits text := public.normalize_phone_digits(new.phone);
begin
  if v_digits is null then
    return new;
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.id is distinct from new.id
      and public.normalize_phone_digits(p.phone) = v_digits
  ) then
    raise exception 'PHONE_ALREADY_REGISTERED'
      using errcode = 'P0001',
            hint = 'This phone number is already registered to another account.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_unique_profile_phone on public.profiles;
create trigger trg_enforce_unique_profile_phone
  before insert or update of phone
  on public.profiles
  for each row
  execute function public.enforce_unique_profile_phone();
