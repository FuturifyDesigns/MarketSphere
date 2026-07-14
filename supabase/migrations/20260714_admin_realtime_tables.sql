-- Enable Realtime for admin dashboard tables (contacts, enquiries, etc.)

do $$
declare
  t text;
begin
  foreach t in array array[
    'contact_messages',
    'enquiries',
    'profiles',
    'providers',
    'categories',
    'testimonials'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;
