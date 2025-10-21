-- Supabase schema for Horeca Weekly Board (initial migration)

-- Create Day table
CREATE TABLE IF NOT EXISTS "Day" (
  "id" SERIAL PRIMARY KEY,
  "dateISO" TIMESTAMPTZ UNIQUE NOT NULL,
  "weekday" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Entry table (consolidates all entry types)
CREATE TABLE IF NOT EXISTS "Entry" (
  "id" SERIAL PRIMARY KEY,
  "dayId" INTEGER NOT NULL REFERENCES "Day"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL CHECK ("type" IN ('breakfast', 'hotel', 'golf', 'event')),
  "size" INTEGER,
  "label" TEXT,
  "isAmbiguous" BOOLEAN DEFAULT FALSE,
  "source" TEXT,
  "title" TEXT,
  "participantsCount" INTEGER,
  "time" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "location" TEXT,
  "capacity" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_entry_day_type" ON "Entry"("dayId", "type");
CREATE INDEX IF NOT EXISTS "idx_day_date" ON "Day"("dateISO");

-- RLS
ALTER TABLE "Day" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;

-- Policies (public read/write as requested)
DO $$ BEGIN
  CREATE POLICY "Allow public read access on Day" ON "Day" FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public read access on Entry" ON "Entry" FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public insert on Day" ON "Day" FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public update on Day" ON "Day" FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public delete on Day" ON "Day" FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public insert on Entry" ON "Entry" FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public update on Entry" ON "Entry" FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public delete on Entry" ON "Entry" FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


