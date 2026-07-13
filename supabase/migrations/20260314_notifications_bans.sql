-- Notifications, user bans, and admin user management
-- Run in Supabase SQL editor if not using CLI migrate

-- ---------------------------------------------------------------------------
-- Profile ban fields
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists banned_at timestamptz,
  add column if not exists ban_reason text,
  add column if not exists banned_by uuid references public.profiles(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  link text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users mark own notifications read" on public.notifications;
create policy "Users mark own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.notify_user(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_body text,
  notification_link text default null,
  notification_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    return;
  end if;

  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    target_user_id,
    notification_type,
    notification_title,
    notification_body,
    notification_link,
    coalesce(notification_metadata, '{}'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin RPCs
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_user_ban(
  target_user_id uuid,
  should_ban boolean,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed_reason text := nullif(trim(coalesce(reason, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot ban your own account';
  end if;

  if should_ban then
    update public.profiles
    set
      banned_at = now(),
      ban_reason = coalesce(trimmed_reason, 'Your account has been suspended by an administrator.'),
      banned_by = auth.uid()
    where id = target_user_id;
  else
    update public.profiles
    set
      banned_at = null,
      ban_reason = null,
      banned_by = null
    where id = target_user_id;

    perform public.notify_user(
      target_user_id,
      'account_unbanned',
      'Account restored',
      'Your account suspension has been lifted. You can sign in again.',
      '/login',
      jsonb_build_object('unbanned_at', now())
    );
  end if;
end;
$$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.admin_set_user_ban(uuid, boolean, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enquiry insert policy: customers only, not banned
-- ---------------------------------------------------------------------------
drop policy if exists "Customers can create enquiries" on public.enquiries;
create policy "Customers can create enquiries"
  on public.enquiries for insert
  with check (
    auth.uid() = customer_id
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'customer'
        and banned_at is null
    )
  );

-- ---------------------------------------------------------------------------
-- Notification triggers
-- ---------------------------------------------------------------------------
create or replace function public.on_enquiry_created_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_user_id uuid;
  provider_name text;
  customer_name text;
begin
  select p.user_id, p.business_name
  into provider_user_id, provider_name
  from public.providers p
  where p.id = new.provider_id;

  select coalesce(full_name, email, 'A customer')
  into customer_name
  from public.profiles
  where id = new.customer_id;

  perform public.notify_user(
    provider_user_id,
    'enquiry_new',
    'New enquiry received',
    customer_name || ' sent: ' || new.subject,
    '/dashboard/provider',
    jsonb_build_object('enquiry_id', new.id, 'tab', 'inbox')
  );

  perform public.notify_user(
    new.customer_id,
    'enquiry_sent',
    'Enquiry sent',
    'Your message to ' || coalesce(provider_name, 'the provider') || ' was delivered.',
    '/dashboard/customer',
    jsonb_build_object('enquiry_id', new.id)
  );

  insert into public.notifications (user_id, type, title, body, link, metadata)
  select
    p.id,
    'enquiry_new_admin',
    'New platform enquiry',
    customer_name || ' → ' || coalesce(provider_name, 'provider') || ': ' || new.subject,
    '/dashboard/admin',
    jsonb_build_object('enquiry_id', new.id, 'tab', 'enquiries')
  from public.profiles p
  where p.role = 'admin';

  return new;
end;
$$;

drop trigger if exists enquiries_notify_insert on public.enquiries;
create trigger enquiries_notify_insert
  after insert on public.enquiries
  for each row execute function public.on_enquiry_created_notify();

create or replace function public.on_enquiry_status_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_name text;
begin
  if new.customer_id is null or new.status = old.status then
    return new;
  end if;

  if new.status not in ('read', 'replied', 'closed') then
    return new;
  end if;

  select business_name into provider_name
  from public.providers
  where id = new.provider_id;

  perform public.notify_user(
    new.customer_id,
    'enquiry_updated',
    'Enquiry update',
  case new.status
      when 'read' then coalesce(provider_name, 'The provider') || ' has read your enquiry.'
      when 'replied' then coalesce(provider_name, 'The provider') || ' has replied to your enquiry.'
      else 'Your enquiry with ' || coalesce(provider_name, 'the provider') || ' was closed.'
    end,
    '/dashboard/customer',
    jsonb_build_object('enquiry_id', new.id, 'status', new.status)
  );

  return new;
end;
$$;

drop trigger if exists enquiries_notify_status on public.enquiries;
create trigger enquiries_notify_status
  after update of status on public.enquiries
  for each row execute function public.on_enquiry_status_notify();

create or replace function public.on_contact_message_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link, metadata)
  select
    p.id,
    'contact_new',
    'New contact message',
    new.full_name || ' wrote: ' || left(new.message, 120),
    '/dashboard/admin',
    jsonb_build_object('contact_id', new.id, 'tab', 'contacts')
  from public.profiles p
  where p.role = 'admin';

  return new;
end;
$$;

drop trigger if exists contact_messages_notify_insert on public.contact_messages;
create trigger contact_messages_notify_insert
  after insert on public.contact_messages
  for each row execute function public.on_contact_message_notify();

create or replace function public.on_profile_ban_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.banned_at is not null
    and (old.banned_at is null or old.banned_at is distinct from new.banned_at) then
    perform public.notify_user(
      new.id,
      'account_banned',
      'Account suspended',
      coalesce(new.ban_reason, 'Your account has been suspended by an administrator.'),
      '/login',
      jsonb_build_object('banned_at', new.banned_at)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_ban_notify on public.profiles;
create trigger profiles_ban_notify
  after update of banned_at, ban_reason on public.profiles
  for each row execute function public.on_profile_ban_notify();

-- Enable realtime (safe if already added)
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;
