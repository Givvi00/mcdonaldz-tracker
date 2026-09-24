-- Asking to join: someone not invited leaves a request, the owner gets an email and accepts or refuses it from a link
-- (see supabase/functions/request-access and review-access). Run once in the SQL Editor, after 0002_unique_names.sql.
--
-- Only the two server functions touch this table (with the service key, which never leaves Supabase): no grants to
-- the app, and Row Level Security on with no rules, so the public key can neither read nor write it.

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254 and position('@' in email) > 1),
  name text check (char_length(name) <= 40),
  -- sha-256 of the secret in the owner's link: the link itself is never stored
  token_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- One open request per email
create unique index access_requests_one_pending on public.access_requests (lower(email)) where status = 'pending';

alter table public.access_requests enable row level security;
revoke all on public.access_requests from anon, authenticated;

-- Whether an account already exists for this email (for request-access: no request needed, just sign in)
create function public.account_exists(candidate text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users where lower(email) = lower(trim(candidate)))
$$;
revoke all on function public.account_exists(text) from public, anon, authenticated;
grant execute on function public.account_exists(text) to service_role;
