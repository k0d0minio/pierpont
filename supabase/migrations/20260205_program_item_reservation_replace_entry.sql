-- Replace single Entry table with ProgramItem (golf/event) and Reservation (bookings).
-- Step 1: Create new tables

CREATE TABLE IF NOT EXISTS "ProgramItem" (
  "id" SERIAL PRIMARY KEY,
  "dayId" INTEGER NOT NULL REFERENCES "Day"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL CHECK ("type" IN ('golf', 'event')),
  "title" TEXT,
  "description" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "guestCount" INTEGER,
  "capacity" INTEGER,
  "venueTypeId" INTEGER REFERENCES "VenueType"("id") ON DELETE SET NULL,
  "pocId" INTEGER REFERENCES "PointOfContact"("id") ON DELETE SET NULL,
  "tableBreakdown" JSONB,
  "isRecurring" BOOLEAN DEFAULT FALSE,
  "recurrenceFrequency" TEXT CHECK ("recurrenceFrequency" IS NULL OR "recurrenceFrequency" IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  "isTourOperator" BOOLEAN DEFAULT FALSE,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_program_item_day" ON "ProgramItem"("dayId");
CREATE INDEX IF NOT EXISTS "idx_program_item_day_type" ON "ProgramItem"("dayId", "type");
CREATE INDEX IF NOT EXISTS "idx_program_item_recurring" ON "ProgramItem"("isRecurring", "recurrenceFrequency") WHERE "isRecurring" = TRUE;

CREATE TABLE IF NOT EXISTS "Reservation" (
  "id" SERIAL PRIMARY KEY,
  "dayId" INTEGER NOT NULL REFERENCES "Day"("id") ON DELETE CASCADE,
  "guestName" TEXT,
  "phoneNumber" TEXT,
  "email" TEXT,
  "guestCount" INTEGER,
  "startTime" TEXT,
  "endTime" TEXT,
  "notes" TEXT,
  "isTourOperator" BOOLEAN DEFAULT FALSE,
  "hotelBookingId" INTEGER REFERENCES "HotelBooking"("id") ON DELETE CASCADE,
  "programItemId" INTEGER REFERENCES "ProgramItem"("id") ON DELETE SET NULL,
  "tableIndex" SMALLINT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_reservation_day" ON "Reservation"("dayId");
CREATE INDEX IF NOT EXISTS "idx_reservation_hotel_booking" ON "Reservation"("hotelBookingId");
CREATE INDEX IF NOT EXISTS "idx_reservation_program_item" ON "Reservation"("programItemId");

-- RLS for new tables
ALTER TABLE "ProgramItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reservation" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public read access on ProgramItem" ON "ProgramItem" FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public insert on ProgramItem" ON "ProgramItem" FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public update on ProgramItem" ON "ProgramItem" FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public delete on ProgramItem" ON "ProgramItem" FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read access on Reservation" ON "Reservation" FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public insert on Reservation" ON "Reservation" FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public update on Reservation" ON "Reservation" FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow public delete on Reservation" ON "Reservation" FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Step 2: Migrate data (ProgramItem from golf/event Entry; Reservation from reservation Entry)
-- ProgramItem: Entry.id preserved so Reservation.eventEntryId can point to ProgramItem.id after migration
INSERT INTO "ProgramItem" (
  "id", "dayId", "type", "title", "description", "startTime", "endTime",
  "guestCount", "capacity", "venueTypeId", "pocId", "tableBreakdown",
  "isRecurring", "recurrenceFrequency", "isTourOperator", "notes", "createdAt", "updatedAt"
)
SELECT
  "id", "dayId", "type", "title", "description", "startTime", "endTime",
  COALESCE("size", "guestCount"), "capacity", "venueTypeId", "pocId", "tableBreakdown",
  COALESCE("isRecurring", FALSE), "recurrenceFrequency", COALESCE("isTourOperator", FALSE), "notes", "createdAt", "updatedAt"
FROM "Entry"
WHERE "type" IN ('golf', 'event');

SELECT setval('"ProgramItem_id_seq"', COALESCE((SELECT MAX("id") FROM "ProgramItem"), 1));

-- Reservation: eventEntryId becomes programItemId (same id space after ProgramItem insert)
INSERT INTO "Reservation" (
  "id", "dayId", "guestName", "phoneNumber", "email", "guestCount", "startTime", "endTime",
  "notes", "isTourOperator", "hotelBookingId", "programItemId", "tableIndex", "createdAt", "updatedAt"
)
SELECT
  "id", "dayId", "guestName", "phoneNumber", "email", "guestCount", "startTime", "endTime",
  "notes", COALESCE("isTourOperator", FALSE), "hotelBookingId", "eventEntryId", "tableIndex", "createdAt", "updatedAt"
FROM "Entry"
WHERE "type" = 'reservation';

SELECT setval('"Reservation_id_seq"', COALESCE((SELECT MAX("id") FROM "Reservation"), 1));

-- Step 3: Drop Entry and optional HotelBooking.roomNumber
ALTER TABLE "Entry" DROP CONSTRAINT IF EXISTS "Entry_eventEntryId_fkey";
DROP TABLE IF EXISTS "Entry";

ALTER TABLE "HotelBooking" DROP COLUMN IF EXISTS "roomNumber";
