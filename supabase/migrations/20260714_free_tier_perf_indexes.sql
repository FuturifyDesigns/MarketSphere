-- Free-tier friendly indexes for common public/dashboard queries.

create index if not exists providers_status_created_at_idx
  on public.providers (status, created_at desc);

create index if not exists testimonials_approved_created_at_idx
  on public.testimonials (approved, created_at desc)
  where approved = true;

create index if not exists contact_messages_email_created_at_idx
  on public.contact_messages (lower(email), created_at desc);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists enquiries_customer_created_at_idx
  on public.enquiries (customer_id, created_at desc);

create index if not exists enquiries_provider_created_at_idx
  on public.enquiries (provider_id, created_at desc);

create index if not exists favorites_provider_id_idx
  on public.favorites (provider_id);
