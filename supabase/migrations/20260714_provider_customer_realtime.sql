-- Customer/provider dashboard Realtime: favorites + filtered change reliability

do $$
begin
  begin
    alter publication supabase_realtime add table public.favorites;
  exception
    when duplicate_object then null;
  end;
end $$;

alter table public.enquiries replica identity full;
alter table public.favorites replica identity full;
