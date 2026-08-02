-- Fan out FCM when a notification row is inserted.
-- Requires: Edge Function `push-on-notification` + secret FCM_SERVICE_ACCOUNT_JSON
-- and extension pg_net (enabled on hosted projects).

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
begin
  perform net.http_post(
    url := 'https://creaxptcrptygvmtioub.supabase.co/functions/v1/push-on-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(NEW)
    ),
    timeout_milliseconds := 5000
  );
  return NEW;
end;
$$;

comment on function public.notify_push_on_notification() is
  'Fans out FCM via Edge Function push-on-notification after each notifications insert.';

drop trigger if exists trg_push_on_notification on public.notifications;
create trigger trg_push_on_notification
after insert on public.notifications
for each row
execute function public.notify_push_on_notification();
