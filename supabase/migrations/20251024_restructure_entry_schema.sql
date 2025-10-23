-- Create PointOfContact table
CREATE TABLE IF NOT EXISTS "PointOfContact" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "phoneNumber" TEXT,
  "email" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for POC lookups
CREATE INDEX IF NOT EXISTS "idx_poc_name" ON "PointOfContact"("name");

-- Add new columns to Entry table
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "guestName" TEXT;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "roomNumber" TEXT;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "guestCount" INTEGER;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "pocId" INTEGER REFERENCES "PointOfContact"("id") ON DELETE SET NULL;

-- Add phoneNumber and email columns for reservations
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Add constraint for location enum
ALTER TABLE "Entry" DROP CONSTRAINT IF EXISTS "Entry_location_check";
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_location_check" 
  CHECK ("location" IS NULL OR "location" IN ('eagle', 'sports', 'events-hall', 'restaurant', 'terrace', 'courtyard'));

-- RLS Policies for PointOfContact table
ALTER TABLE "PointOfContact" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public read access on PointOfContact" ON "PointOfContact" FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert on PointOfContact" ON "PointOfContact" FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public update on PointOfContact" ON "PointOfContact" FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public delete on PointOfContact" ON "PointOfContact" FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
