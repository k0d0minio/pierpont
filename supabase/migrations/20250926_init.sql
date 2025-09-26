-- Migration: Initial schema for D&D 5e Companion PWA
-- Includes: profiles, characters, character_equipment, character_spells, character_notes
-- Adds: RLS policies, indexes, updated_at triggers

-- Enable required extensions
create extension if not exists pgcrypto; -- for gen_random_uuid on some Postgres installs

-- Updated at trigger helper
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- profiles table (links to Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- characters table
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  class_id text not null,
  race_id text not null,
  background_id text not null,
  level integer default 1 check (level >= 1 and level <= 20),
  ability_scores jsonb not null default '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  hit_points integer default 0,
  armor_class integer default 10,
  speed integer default 30,
  proficiency_bonus integer default 2,
  skills jsonb default '{}',
  saving_throws jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- character_equipment table
create table if not exists public.character_equipment (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id) on delete cascade,
  equipment_id text not null,
  quantity integer default 1,
  equipped boolean default false,
  attuned boolean default false,
  created_at timestamptz default now()
);

-- character_spells table
create table if not exists public.character_spells (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id) on delete cascade,
  spell_id text not null,
  prepared boolean default false,
  spell_slots_used jsonb default '{}',
  created_at timestamptz default now()
);

-- character_notes table
create table if not exists public.character_notes (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id) on delete cascade,
  title text not null,
  content text,
  note_type text default 'general',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_characters_user_id on public.characters(user_id);
create index if not exists idx_character_equipment_character_id on public.character_equipment(character_id);
create index if not exists idx_character_spells_character_id on public.character_spells(character_id);
create index if not exists idx_character_notes_character_id on public.character_notes(character_id);

-- RLS enablement
alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.character_equipment enable row level security;
alter table public.character_spells enable row level security;
alter table public.character_notes enable row level security;

-- Profiles RLS: users can select/update their own row; insert allowed for service role only
drop policy if exists "Enable read access to own profile" on public.profiles;
create policy "Enable read access to own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Enable update for users on own profile" on public.profiles;
create policy "Enable update for users on own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Characters RLS: owner only
drop policy if exists "Enable read for character owners" on public.characters;
create policy "Enable read for character owners"
  on public.characters for select using (auth.uid() = user_id);

drop policy if exists "Enable insert for character owners" on public.characters;
create policy "Enable insert for character owners"
  on public.characters for insert with check (auth.uid() = user_id);

drop policy if exists "Enable update for character owners" on public.characters;
create policy "Enable update for character owners"
  on public.characters for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Enable delete for character owners" on public.characters;
create policy "Enable delete for character owners"
  on public.characters for delete using (auth.uid() = user_id);

-- Child tables: enforce ownership via join to characters
drop policy if exists "Read equipment for character owners" on public.character_equipment;
create policy "Read equipment for character owners"
  on public.character_equipment for select
  using (exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()
  ));

drop policy if exists "CUD equipment for character owners" on public.character_equipment;
create policy "CUD equipment for character owners"
  on public.character_equipment for all
  using (exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()
  ));

drop policy if exists "Read spells for character owners" on public.character_spells;
create policy "Read spells for character owners"
  on public.character_spells for select
  using (exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()
  ));

drop policy if exists "CUD spells for character owners" on public.character_spells;
create policy "CUD spells for character owners"
  on public.character_spells for all
  using (exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()
  ));

drop policy if exists "Read notes for character owners" on public.character_notes;
create policy "Read notes for character owners"
  on public.character_notes for select
  using (exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()
  ));

drop policy if exists "CUD notes for character owners" on public.character_notes;
create policy "CUD notes for character owners"
  on public.character_notes for all
  using (exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()
  ));

-- updated_at triggers
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_characters_updated_at on public.characters;
create trigger trg_characters_updated_at
  before update on public.characters
  for each row execute function set_updated_at();

drop trigger if exists trg_character_notes_updated_at on public.character_notes;
create trigger trg_character_notes_updated_at
  before update on public.character_notes
  for each row execute function set_updated_at();

