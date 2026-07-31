-- Prevent silent duplicate signups: clients can ask if an email is already registered.
-- Email enumeration is already possible via auth.signUp empty-identities responses.

create or replace function public.email_already_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.email_already_registered(text) from public;
grant execute on function public.email_already_registered(text) to anon, authenticated;

comment on function public.email_already_registered(text) is
  'Returns true when a profile already exists for this email. Used to block duplicate Customer/Provider signups.';
