-- Create HotelBooking table for multi-day hotel stays
CREATE TABLE IF NOT EXISTS "HotelBooking" (
  "id" SERIAL PRIMARY KEY,
  "guestName" TEXT,
  "roomNumber" TEXT,
  "guestCount" INTEGER,
  "checkInDate" DATE NOT NULL,
  "checkOutDate" DATE NOT NULL,
  "notes" TEXT,
  "isTourOperator" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "checkOut_after_checkIn" CHECK ("checkOutDate" > "checkInDate")
);

-- Create BreakfastConfiguration table for breakfast table breakdowns
CREATE TABLE IF NOT EXISTS "BreakfastConfiguration" (
  "id" SERIAL PRIMARY KEY,
  "hotelBookingId" INTEGER NOT NULL REFERENCES "HotelBooking"("id") ON DELETE CASCADE,
  "breakfastDate" DATE NOT NULL,
  "tableBreakdown" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "totalGuests" INTEGER NOT NULL DEFAULT 0,
  "startTime" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT "tableBreakdown_is_array" CHECK (jsonb_typeof("tableBreakdown") = 'array'),
  CONSTRAINT "totalGuests_positive" CHECK ("totalGuests" >= 0)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS "idx_hotel_booking_dates" ON "HotelBooking"("checkInDate", "checkOutDate");
CREATE INDEX IF NOT EXISTS "idx_hotel_booking_checkIn" ON "HotelBooking"("checkInDate");
CREATE INDEX IF NOT EXISTS "idx_hotel_booking_checkOut" ON "HotelBooking"("checkOutDate");
CREATE INDEX IF NOT EXISTS "idx_breakfast_config_booking" ON "BreakfastConfiguration"("hotelBookingId");
CREATE INDEX IF NOT EXISTS "idx_breakfast_config_date" ON "BreakfastConfiguration"("breakfastDate");

-- Function to automatically calculate totalGuests from tableBreakdown
CREATE OR REPLACE FUNCTION calculate_breakfast_total_guests()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle both JSONB array and JSONB string cases
  IF jsonb_typeof(NEW."tableBreakdown") = 'array' THEN
    SELECT COALESCE(SUM((value::text)::integer), 0)
    INTO NEW."totalGuests"
    FROM jsonb_array_elements(NEW."tableBreakdown");
  ELSIF jsonb_typeof(NEW."tableBreakdown") = 'string' THEN
    -- If it's a string, try to parse it as JSON array
    DECLARE
      parsed_array JSONB;
    BEGIN
      parsed_array := NEW."tableBreakdown"::text::jsonb;
      IF jsonb_typeof(parsed_array) = 'array' THEN
        SELECT COALESCE(SUM((value::text)::integer), 0)
        INTO NEW."totalGuests"
        FROM jsonb_array_elements(parsed_array);
      ELSE
        NEW."totalGuests" := 0;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NEW."totalGuests" := 0;
    END;
  ELSE
    NEW."totalGuests" := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update totalGuests when tableBreakdown changes
CREATE TRIGGER update_breakfast_total_guests
  BEFORE INSERT OR UPDATE ON "BreakfastConfiguration"
  FOR EACH ROW
  EXECUTE FUNCTION calculate_breakfast_total_guests();

-- RLS Policies for HotelBooking table
ALTER TABLE "HotelBooking" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public read access on HotelBooking" ON "HotelBooking" FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert on HotelBooking" ON "HotelBooking" FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public update on HotelBooking" ON "HotelBooking" FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public delete on HotelBooking" ON "HotelBooking" FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for BreakfastConfiguration table
ALTER TABLE "BreakfastConfiguration" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public read access on BreakfastConfiguration" ON "BreakfastConfiguration" FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert on BreakfastConfiguration" ON "BreakfastConfiguration" FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public update on BreakfastConfiguration" ON "BreakfastConfiguration" FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public delete on BreakfastConfiguration" ON "BreakfastConfiguration" FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

