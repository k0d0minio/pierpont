-- Add reservation type to Entry table
ALTER TABLE "Entry" DROP CONSTRAINT IF EXISTS "Entry_type_check";
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_type_check" CHECK ("type" IN ('breakfast', 'hotel', 'golf', 'event', 'reservation'));
