-- Auto-approve provider listings (no admin approval required)
alter table public.providers alter column status set default 'approved';

update public.providers
set status = 'approved', updated_at = now()
where status = 'pending';
