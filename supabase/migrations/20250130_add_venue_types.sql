-- Create VenueType table
CREATE TABLE IF NOT EXISTS "VenueType" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "code" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Insert existing venue types
INSERT INTO "VenueType" ("name", "code") VALUES
  ('Eagle', 'eagle'),
  ('Sports', 'sports'),
  ('Events Hall', 'events-hall'),
  ('Restaurant', 'restaurant'),
  ('Terrace', 'terrace'),
  ('Courtyard', 'courtyard')
ON CONFLICT ("code") DO NOTHING;

-- Add venueTypeId column to Entry table
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "venueTypeId" INTEGER REFERENCES "VenueType"("id") ON DELETE SET NULL;

-- Migrate existing location values to venueTypeId
UPDATE "Entry" e
SET "venueTypeId" = vt."id"
FROM "VenueType" vt
WHERE e."location" = vt."code"
AND e."venueTypeId" IS NULL;

-- Remove the old CHECK constraint on location
ALTER TABLE "Entry" DROP CONSTRAINT IF EXISTS "Entry_location_check";

-- Keep location column for backward compatibility but it's now optional
-- We'll use venueTypeId going forward

-- RLS Policies for VenueType table
ALTER TABLE "VenueType" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public read access on VenueType" ON "VenueType" FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert on VenueType" ON "VenueType" FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public update on VenueType" ON "VenueType" FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public delete on VenueType" ON "VenueType" FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create index for venue type lookups
CREATE INDEX IF NOT EXISTS "idx_entry_venue_type" ON "Entry"("venueTypeId");

