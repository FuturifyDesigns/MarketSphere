-- Harden signup roles, profiles privilege escalation, and contact form abuse controls.

-- ---------------------------------------------------------------------------
-- 1) Signup: only customer/provider via metadata (admin remains email-promoted)
-- ---------------------------------------------------------------------------
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

  if lower(coalesce(new.email, '')) = lower('imcalledsammy@gmail.com') then
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

-- ---------------------------------------------------------------------------
-- 2) Profiles: non-admins cannot change role / email / ban fields
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

  new.role := old.role;
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
-- 3) Contact form: validated + rate-limited RPC; revoke open anon inserts
-- ---------------------------------------------------------------------------
create or replace function public.submit_contact_message(
  p_full_name text,
  p_email text,
  p_phone text default null,
  p_message text default null,
  p_honeypot text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_full_name, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
  v_message text := trim(coalesce(p_message, ''));
  v_recent int;
begin
  -- Bot trap: honeypot must stay empty
  if coalesce(trim(p_honeypot), '') <> '' then
    return;
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Invalid name';
  end if;

  if v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or char_length(v_email) > 254 then
    raise exception 'Invalid email';
  end if;

  if char_length(v_message) < 10 or char_length(v_message) > 2000 then
    raise exception 'Invalid message';
  end if;

  if v_phone is not null and char_length(v_phone) > 40 then
    raise exception 'Invalid phone';
  end if;

  -- Rate limit: max 3 messages per email per hour
  select count(*)::int
    into v_recent
  from public.contact_messages
  where lower(email) = v_email
    and created_at > now() - interval '1 hour';

  if v_recent >= 3 then
    raise exception 'Too many messages. Please try again later.';
  end if;

  -- Soft global flood control: max 30 messages in rolling 10 minutes
  select count(*)::int
    into v_recent
  from public.contact_messages
  where created_at > now() - interval '10 minutes';

  if v_recent >= 30 then
    raise exception 'Service is busy. Please try again later.';
  end if;

  insert into public.contact_messages (full_name, email, phone, message)
  values (v_name, v_email, v_phone, v_message);
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;

drop policy if exists "Anyone can submit contact messages" on public.contact_messages;

-- ---------------------------------------------------------------------------
-- 4) Enquiries: basic per-user rate limit via trigger
-- ---------------------------------------------------------------------------
create or replace function public.enforce_enquiry_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent int;
begin
  if auth.uid() is null or new.customer_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if char_length(trim(coalesce(new.subject, ''))) < 3
     or char_length(trim(coalesce(new.message, ''))) < 10 then
    raise exception 'Invalid enquiry';
  end if;

  select count(*)::int
    into v_recent
  from public.enquiries
  where customer_id = auth.uid()
    and created_at > now() - interval '10 minutes';

  if v_recent >= 5 then
    raise exception 'Too many enquiries. Please wait a few minutes.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_enquiry_rate_limit on public.enquiries;
create trigger enforce_enquiry_rate_limit
  before insert on public.enquiries
  for each row
  execute function public.enforce_enquiry_rate_limit();

-- ---------------------------------------------------------------------------
-- 5) Providers: ignore client-supplied approved status for non-admins
-- ---------------------------------------------------------------------------
create or replace function public.protect_provider_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.status := 'pending';
    end if;
    return new;
  end if;

  if not public.is_admin() then
    new.status := old.status;
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_provider_status on public.providers;
create trigger protect_provider_status
  before insert or update on public.providers
  for each row
  execute function public.protect_provider_status();
