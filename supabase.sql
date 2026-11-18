-- Run once in Supabase → SQL Editor.
-- Only the server (service key) touches this table, so RLS is on with NO policies:
-- the public anon key can neither read nor write it.

create table if not exists public.rsvps (
  id          bigint generated always as identity primary key,
  name        text        not null check (char_length(name) between 2 and 80),
  attending   boolean     not null default true,
  pax         int         not null check (pax between 0 and 20),   -- 0 when not attending
  message     text        check (message is null or char_length(message) <= 300),
  created_at  timestamptz not null default now()
);

alter table public.rsvps enable row level security;

-- If you already ran the first version of this file (name + pax only), run this instead:
--   alter table public.rsvps add column if not exists attending boolean not null default true;
--   alter table public.rsvps add column if not exists message text check (message is null or char_length(message) <= 300);
--   alter table public.rsvps drop constraint if exists rsvps_pax_check;
--   alter table public.rsvps add constraint rsvps_pax_check check (pax between 0 and 20);
