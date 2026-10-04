-- Invites (version 1.4): anyone in the app makes a link for a friend, who opens it, writes their email and is in
-- straight away, without waiting for the owner. One person per link, valid 7 days (see supabase/functions/invite).
-- Run once in the SQL Editor, after 0006, BEFORE deploying the invite function.
--
-- Only the server function touches this table (with the service key): Row Level Security on with no rules, no grants
-- to the app.

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  inviter uuid not null references auth.users (id) on delete cascade,
  -- sha-256 of the secret in the link: the link itself is never stored
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  used_email text check (used_email is null or char_length(used_email) <= 254)
);

create index invites_inviter on public.invites (inviter);

alter table public.invites enable row level security;
revoke all on public.invites from anon, authenticated;
grant select, insert, update, delete on public.invites to service_role;
