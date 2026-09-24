-- A name belongs to one account only (Gabri and gabri count as the same), ready for friends and leaderboards.
-- Run once in the SQL Editor, after 0001_account.sql.

-- Names already online are made unique first, should two accounts share one: the later one loses it (and is asked
-- for a new one by the app)
update public.profiles p set name = null
where name is not null and exists (
  select 1 from public.profiles q
  where lower(q.name) = lower(p.name) and (q.updated_at, q.id) < (p.updated_at, p.id)
);

alter table public.profiles add constraint profiles_name_not_blank check (name is null or char_length(trim(name)) > 0);
create unique index profiles_name_unique on public.profiles (lower(name)) where name is not null;

-- Whether a name is free (yours counts as free). Tells only yes or no: nobody can read the other profiles.
create function public.name_available(candidate text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.profiles
    where lower(name) = lower(trim(candidate)) and id <> auth.uid()
  )
$$;
revoke all on function public.name_available(text) from public, anon;
grant execute on function public.name_available(text) to authenticated;
