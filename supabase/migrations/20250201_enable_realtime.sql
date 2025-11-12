-- Enable Realtime for schedule tables
-- This allows clients to subscribe to database changes in real-time

-- Enable Realtime on Day table
ALTER PUBLICATION supabase_realtime ADD TABLE "Day";

-- Enable Realtime on Entry table
ALTER PUBLICATION supabase_realtime ADD TABLE "Entry";

-- Enable Realtime on HotelBooking table
ALTER PUBLICATION supabase_realtime ADD TABLE "HotelBooking";

-- Enable Realtime on BreakfastConfiguration table
ALTER PUBLICATION supabase_realtime ADD TABLE "BreakfastConfiguration";

