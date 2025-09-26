-- Basic RLS tests using Supabase semantics locally
-- NOTE: In Supabase, auth.uid() is set from JWT. Locally we simulate with SET LOCAL ROLE not available,
-- so we create a mock function to override auth.uid() in this session only.

-- Create a mock auth schema/functions if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
  ) THEN
    CREATE SCHEMA auth;
  END IF;
END$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.sub', true)::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- session users
SELECT '00000000-0000-0000-0000-000000000001'::uuid AS user_a \gset
SELECT '00000000-0000-0000-0000-000000000002'::uuid AS user_b \gset

-- Ensure auth.users exist for FKs
INSERT INTO auth.users(id) VALUES (:'user_a') ON CONFLICT DO NOTHING;
INSERT INTO auth.users(id) VALUES (:'user_b') ON CONFLICT DO NOTHING;

-- Create profiles for A and B
SET request.jwt.claim.sub = :'user_a';
INSERT INTO public.profiles(id, username, display_name) VALUES (:'user_a', 'alice', 'Alice')
ON CONFLICT (id) DO NOTHING;

SET request.jwt.claim.sub = :'user_b';
INSERT INTO public.profiles(id, username, display_name) VALUES (:'user_b', 'bob', 'Bob')
ON CONFLICT (id) DO NOTHING;

-- Insert character for Alice
SET request.jwt.claim.sub = :'user_a';
INSERT INTO public.characters(user_id, name, class_id, race_id, background_id)
VALUES (:'user_a', 'Alice Hero', 'fighter', 'human', 'soldier') RETURNING id \gset

-- Alice can read own character
SELECT name FROM public.characters WHERE id = :'id';

-- Bob cannot read Alice character (should return 0 rows)
SET request.jwt.claim.sub = :'user_b';
SELECT name FROM public.characters WHERE id = :'id';

-- Bob cannot update Alice
UPDATE public.characters SET name = 'Hacker' WHERE id = :'id';

-- Alice adds equipment/spell/note
SET LOCAL request.jwt.claim.sub :'user_a';
INSERT INTO public.character_equipment(character_id, equipment_id, quantity) VALUES (:'id','longsword',1);
INSERT INTO public.character_spells(character_id, spell_id, prepared) VALUES (:'id','fire-bolt',true);
INSERT INTO public.character_notes(character_id, title, content) VALUES (:'id','Session 1','Met the party.');

-- Bob cannot see those children
SET LOCAL request.jwt.claim.sub :'user_b';
SELECT count(*) FROM public.character_equipment WHERE character_id = :'id';
SELECT count(*) FROM public.character_spells WHERE character_id = :'id';
SELECT count(*) FROM public.character_notes WHERE character_id = :'id';

