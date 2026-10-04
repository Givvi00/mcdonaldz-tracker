-- Visit counter (version 1.1): the returns to a restaurant, counted by the app when the GPS confirms you are there
-- (at most once every 4 hours, see src/utils/checkins.ts), and the total of all visits in the friends' summary.
-- Run once in the SQL Editor, after 0005, BEFORE publishing version 1.1 (the app reads these columns).

-- Times (ms) of the later returns to that restaurant; the first visit is visited_at
alter table public.visits
  add column checkins bigint[] check (checkins is null or (cardinality(checkins) <= 1000 and array_position(checkins, null) is null));

-- Every visit, returns included: shown in the friend's sheet
alter table public.public_stats
  add column visits_total integer not null default 0 check (visits_total between 0 and 100000);

-- The friends' list now carries it too: the function is replaced with the new column added at the end
drop function public.friends_board();
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
  updated_at timestamptz,
  visits_total integer
)
language sql stable security definer set search_path = '' as $$
  select s.user_id, p.name, s.visited, s.verified, s.level, s.regions, s.stamps, s.last_visit, s.updated_at, s.visits_total
  from public.public_stats s
  join public.profiles p on p.id = s.user_id
  where auth.uid() is not null and p.name is not null
  order by s.visited desc, s.verified desc, p.name
  limit 500
$$;
revoke all on function public.friends_board() from public, anon;
grant execute on function public.friends_board() to authenticated;
