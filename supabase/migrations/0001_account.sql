-- Online copy of each person's visits, stamps and name (see src/services/sync.ts).
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run. Never edit it after it has been run:
-- a later change goes in a new file (0002_...).
--
-- Security model: the app holds a public key, so anyone can talk to the database. What protects the data is Row Level
-- Security: every row belongs to one account and only that account can see or change it. Tables are reachable only
-- because of the explicit grants below (new tables are not exposed automatically in this project).
-- Nobody can sign up on their own: accounts are created by the owner in the dashboard (Authentication → Users).

-- ---- Tables -----------------------------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name text check (char_length(name) <= 16),
  updated_at timestamptz not null default now()
);

-- One row per restaurant visited. Times are milliseconds since 1970, exactly as the app keeps them.
create table public.visits (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mcdonald_id text not null check (char_length(mcdonald_id) between 1 and 64),
  visited_at bigint not null,
  date_edited boolean not null default false,
  verified boolean not null default false,
  verified_at bigint,
  rating jsonb check (
    rating is null or (
      jsonb_typeof(rating) = 'object'
      and (rating ->> 'cleanliness')::int between 1 and 5
      and (rating ->> 'staff')::int between 1 and 5
      and (rating ->> 'outdoorSpace')::int between 1 and 5
      and (rating ->> 'speed')::int between 1 and 5
    )
  ),
  updated_at timestamptz not null default now(),
  primary key (user_id, mcdonald_id)
);

-- Stamps and region stickers, once earned never taken back
create table public.achievements (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (char_length(type) between 1 and 80),
  unlocked_at bigint not null,
  value integer,
  primary key (user_id, type)
);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger visits_touch before update on public.visits for each row execute function public.touch_updated_at();

-- ---- Who can do what --------------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.visits enable row level security;
alter table public.achievements enable row level security;

create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "own visits" on public.visits for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own achievements" on public.achievements for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.profiles, public.visits, public.achievements from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.visits, public.achievements to authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

-- ---- Functions the app calls ------------------------------------------------------------------------------------

-- "Elimina account": removes the account; its profile, visits and stamps go with it (on delete cascade)
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Called once a week by .github/workflows/keepalive.yml, so the free project is never paused for lack of use.
-- Reads nothing.
create function public.ping() returns integer
language sql stable set search_path = '' as $$ select 1 $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
