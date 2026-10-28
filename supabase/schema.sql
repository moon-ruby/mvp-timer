-- MVP Timer: shared timers per room.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Access model: there are no accounts. A room is just a long random code in the share link.
-- The client sends that code in an `x-room-id` request header, and RLS only exposes rows
-- whose room_id matches it, so nobody can list other rooms' timers with the public anon key.

create table if not exists public.timers (
  id          uuid primary key,
  room_id     text not null check (char_length(room_id) between 8 and 64),
  monster_id  integer not null,
  map         text not null,
  killed_at   timestamptz,
  note        text not null default '',
  marker      jsonb,
  position    integer not null default 0,
  updated_at  timestamptz not null default now()
);

create index if not exists timers_room_id_idx on public.timers (room_id);

create or replace function public.request_room_id() returns text
language sql stable as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-room-id', '')
$$;

-- Newer Supabase projects don't always grant the anon role access to new tables.
grant select, insert, update, delete on public.timers to anon;

alter table public.timers enable row level security;

drop policy if exists "room select" on public.timers;
drop policy if exists "room insert" on public.timers;
drop policy if exists "room update" on public.timers;
drop policy if exists "room delete" on public.timers;

create policy "room select" on public.timers for select to anon
  using (room_id = public.request_room_id());
create policy "room insert" on public.timers for insert to anon
  with check (room_id = public.request_room_id());
create policy "room update" on public.timers for update to anon
  using (room_id = public.request_room_id())
  with check (room_id = public.request_room_id());
create policy "room delete" on public.timers for delete to anon
  using (room_id = public.request_room_id());
