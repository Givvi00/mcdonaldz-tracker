-- The diary of a visit: what you ate (ids from the app's menu, src/utils/menu.ts) and a short note.
-- Run once in the SQL Editor, after 0004. The app sends these fields as soon as it is published with the diary:
-- run this first, or saving online stops until it is run.
alter table public.visits
  add column notes text check (notes is null or char_length(notes) <= 280),
  add column ate text[] check (ate is null or (cardinality(ate) <= 20 and array_position(ate, null) is null));
