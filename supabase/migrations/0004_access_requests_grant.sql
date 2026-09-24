-- The server functions use the service role, and in this project new tables are not exposed automatically, not even to
-- it: 0003 forgot to let them in. Run once in the SQL Editor.
grant select, insert, update, delete on public.access_requests to service_role;
