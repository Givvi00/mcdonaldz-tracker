-- Friends (step 2): each person's summary, which everybody signed in can see. Run once in the SQL Editor, after 0004.
--
-- What the others see of you is only this summary, written by your own app: level, how many restaurants (and how many
-- verified), the regions as stickers, which stamps, and your last visit (restaurant, city, day). Never the list of your
-- visits, your votes or your position: visits, achievements and profiles stay readable only by their owner.
-- Everybody sees everybody (the app is invite-only, so the people inside are already the group). To see only friends
-- one day, only the rule of friends_board() below changes.

create table public.public_stats (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  visited integer not null default 0 check (visited between 0 and 5000),
  verified integer not null default 0 check (verified between 0 and 5000),
  level integer not null default 1 check (level between 1 and 100),
  -- region -> { v: visited, t: total, ver: verified, vf: verifiable, was: completed once }
  regions jsonb not null default '{}' check (jsonb_typeof(regions) = 'object' and pg_column_size(regions) < 16000),
  stamps text[] not null default '{}' check (cardinality(stamps) <= 300),
  -- { name, city, at (ms) } or null
  last_visit jsonb check (last_visit is null or (jsonb_typeof(last_visit) = 'object' and pg_column_size(last_visit) < 1000)),
  updated_at timestamptz not null default now()
);

create trigger public_stats_touch before update on public.public_stats for each row execute function public.touch_updated_at();

alter table public.public_stats enable row level security;
-- Each person writes and reads only their own row directly; the others are read through friends_board()
create policy "own stats" on public.public_stats for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.public_stats from anon, authenticated;
grant select, insert, update, delete on public.public_stats to authenticated;

-- Everybody with a username, with their summary: the Friends page. Only for people signed in, and only the name from
-- the profiles (the rest of a profile stays private).
create function public.friends_board()
returns table (
  user_id uuid,
  name text,
  visited integer,
  verified integer,
  level integer,
  regions jsonb,
  stamps text[],
  last_visit jsonb,
  updated_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select s.user_id, p.name, s.visited, s.verified, s.level, s.regions, s.stamps, s.last_visit, s.updated_at
  from public.public_stats s
  join public.profiles p on p.id = s.user_id
  where auth.uid() is not null and p.name is not null
  order by s.visited desc, s.verified desc, p.name
  limit 500
$$;
revoke all on function public.friends_board() from public, anon;
grant execute on function public.friends_board() to authenticated;
