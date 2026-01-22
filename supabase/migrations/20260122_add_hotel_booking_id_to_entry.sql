-- Add hotelBookingId to Entry table to link reservations to hotel bookings
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "hotelBookingId" INTEGER REFERENCES "HotelBooking"("id") ON DELETE CASCADE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS "idx_entry_hotel_booking" ON "Entry"("hotelBookingId");
