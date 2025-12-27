-- Seed and RLS test script (run with Supabase SQL editor or psql as service role)

-- Create a demo user profile linked to an existing auth.users row.
-- Replace the UUIDs below with actual auth user IDs in your project when running manually.
-- For local testing with Supabase CLI, you can insert into auth.users and reuse the ID.

-- Example variables
-- select '00000000-0000-0000-0000-000000000001'::uuid as user_a into temp t;

-- Insert profiles (safe to upsert)
insert into public.profiles (id, username, display_name)
values
  ('00000000-0000-0000-0000-000000000001', 'alice', 'Alice Adventurer')
on conflict (id) do update set username = excluded.username, display_name = excluded.display_name;

insert into public.profiles (id, username, display_name)
values
  ('00000000-0000-0000-0000-000000000002', 'bob', 'Bob Bard')
on conflict (id) do update set username = excluded.username, display_name = excluded.display_name;

-- Insert characters owned by Alice
insert into public.characters (user_id, name, class_id, race_id, background_id, level)
values
  ('00000000-0000-0000-0000-000000000001', 'Elowen', 'wizard', 'elf', 'sage', 3)
returning id into temp table t_char(id);

-- Use the returned id from temp table
insert into public.character_equipment (character_id, equipment_id, quantity, equipped)
select id, 'quarterstaff', 1, true from t_char;

insert into public.character_spells (character_id, spell_id, prepared, spell_slots_used)
select id, 'magic-missile', true, '{"1": 1}'::jsonb from t_char;

insert into public.character_notes (character_id, title, content, note_type)
select id, 'Session 1', 'Met the party in Neverwinter.', 'session' from t_char;

-- RLS tests (conceptual; to actually test, set auth.uid() context via Supabase or PostgREST)
-- When auth.uid() = Alice's ID, selecting from characters should return Elowen.
-- When auth.uid() = Bob's ID, selecting from characters should return 0 rows.

