-- Supabase-compatible core schema for D&D 5e Companion
-- Profiles, Characters, Equipment, Spells, Notes
-- Includes RLS, indexes, and updated_at triggers

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Local fallback: minimal auth schema and users table (no-op on Supabase)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY
);

-- Local fallback: auth.uid() if missing (Supabase already provides one)
DO $$
DECLARE
  fn_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth'
      AND p.proname = 'uid'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) INTO fn_exists;

  IF NOT fn_exists THEN
    CREATE FUNCTION auth.uid()
    RETURNS uuid AS $$
    BEGIN
      RETURN current_setting('request.jwt.claim.sub', true)::uuid;
    END;
    $$ LANGUAGE plpgsql STABLE;
  END IF;
END$$;

-- Helper: updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- characters
CREATE TABLE IF NOT EXISTS public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  class_id text NOT NULL,
  race_id text NOT NULL,
  background_id text NOT NULL,
  level integer DEFAULT 1 CHECK (level >= 1 AND level <= 20),
  ability_scores jsonb NOT NULL DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  hit_points integer DEFAULT 0,
  armor_class integer DEFAULT 10,
  speed integer DEFAULT 30,
  proficiency_bonus integer DEFAULT 2,
  skills jsonb DEFAULT '{}',
  saving_throws jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- character_equipment
CREATE TABLE IF NOT EXISTS public.character_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  equipment_id text NOT NULL,
  quantity integer DEFAULT 1,
  equipped boolean DEFAULT false,
  attuned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- character_spells
CREATE TABLE IF NOT EXISTS public.character_spells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  spell_id text NOT NULL,
  prepared boolean DEFAULT false,
  spell_slots_used jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- character_notes
CREATE TABLE IF NOT EXISTS public.character_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  note_type text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_characters_user ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_character ON public.character_equipment(character_id);
CREATE INDEX IF NOT EXISTS idx_spells_character ON public.character_spells(character_id);
CREATE INDEX IF NOT EXISTS idx_notes_character ON public.character_notes(character_id);

-- updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_characters_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_characters_set_updated_at
    BEFORE UPDATE ON public.characters
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notes_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_notes_set_updated_at
    BEFORE UPDATE ON public.character_notes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- RLS: enable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_notes ENABLE ROW LEVEL SECURITY;

-- Policies
-- profiles: users can manage only their own row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Profiles owners select'
  ) THEN
    CREATE POLICY "Profiles owners select" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Profiles owners update'
  ) THEN
    CREATE POLICY "Profiles owners update" ON public.profiles
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Profiles insert self'
  ) THEN
    CREATE POLICY "Profiles insert self" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- characters: only owner can manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='characters' AND policyname='Characters owner select'
  ) THEN
    CREATE POLICY "Characters owner select" ON public.characters
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='characters' AND policyname='Characters owner modify'
  ) THEN
    CREATE POLICY "Characters owner modify" ON public.characters
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- child tables: derive access via character ownership
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='character_equipment' AND policyname='Equipment via character ownership'
  ) THEN
    CREATE POLICY "Equipment via character ownership" ON public.character_equipment
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.characters c
          WHERE c.id = character_id AND c.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.characters c
          WHERE c.id = character_id AND c.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='character_spells' AND policyname='Spells via character ownership'
  ) THEN
    CREATE POLICY "Spells via character ownership" ON public.character_spells
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.characters c
          WHERE c.id = character_id AND c.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.characters c
          WHERE c.id = character_id AND c.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='character_notes' AND policyname='Notes via character ownership'
  ) THEN
    CREATE POLICY "Notes via character ownership" ON public.character_notes
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.characters c
          WHERE c.id = character_id AND c.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.characters c
          WHERE c.id = character_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Optional: seed helper comments (no data inserted here)

