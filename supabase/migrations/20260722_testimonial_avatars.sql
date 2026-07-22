-- Link testimonials to submitter profile photo when signed in.

alter table public.testimonials
  add column if not exists user_id uuid references public.profiles (id) on delete set null,
  add column if not exists avatar_url text;

create index if not exists testimonials_user_id_idx
  on public.testimonials (user_id)
  where user_id is not null;

create or replace function public.submit_testimonial(
  p_client_name text,
  p_content text,
  p_service_type text default null,
  p_rating int default 5,
  p_honeypot text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_client_name, ''));
  v_content text := trim(coalesce(p_content, ''));
  v_service text := nullif(trim(coalesce(p_service_type, '')), '');
  v_rating int := coalesce(p_rating, 5);
  v_recent int;
  v_uid uuid := auth.uid();
  v_avatar text := null;
begin
  -- Bot trap
  if coalesce(trim(p_honeypot), '') <> '' then
    return;
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Invalid name';
  end if;

  if char_length(v_content) < 10 or char_length(v_content) > 800 then
    raise exception 'Invalid testimonial';
  end if;

  if v_service is not null and char_length(v_service) > 80 then
    raise exception 'Invalid service type';
  end if;

  if v_rating < 1 or v_rating > 5 then
    raise exception 'Invalid rating';
  end if;

  -- Per-name rate limit: max 2 submissions / hour
  select count(*)::int
    into v_recent
  from public.testimonials
  where lower(client_name) = lower(v_name)
    and created_at > now() - interval '1 hour';

  if v_recent >= 2 then
    raise exception 'Too many submissions. Please try again later.';
  end if;

  -- Soft global flood control
  select count(*)::int
    into v_recent
  from public.testimonials
  where created_at > now() - interval '10 minutes';

  if v_recent >= 20 then
    raise exception 'Service is busy. Please try again later.';
  end if;

  if v_uid is not null then
    select nullif(trim(p.avatar_url), '')
      into v_avatar
    from public.profiles p
    where p.id = v_uid;
  end if;

  insert into public.testimonials (
    client_name,
    content,
    service_type,
    rating,
    approved,
    user_id,
    avatar_url
  )
  values (
    v_name,
    v_content,
    v_service,
    v_rating,
    false,
    v_uid,
    v_avatar
  );
end;
$$;

revoke all on function public.submit_testimonial(text, text, text, int, text) from public;
grant execute on function public.submit_testimonial(text, text, text, int, text) to anon, authenticated;
