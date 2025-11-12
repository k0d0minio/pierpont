-- Add recurring entry support to Entry table
-- This allows golf and event entries to be marked as recurring with a frequency

-- Add isRecurring column (boolean, defaults to false)
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT FALSE;

-- Add recurrenceFrequency column (text, can be 'weekly', 'biweekly', 'monthly', 'yearly')
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "recurrenceFrequency" TEXT;

-- Add constraint to ensure recurrenceFrequency is only set when isRecurring is true
-- and that it's one of the valid values
ALTER TABLE "Entry" DROP CONSTRAINT IF EXISTS "Entry_recurrence_frequency_check";
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_recurrence_frequency_check" 
  CHECK (
    ("isRecurring" = FALSE AND "recurrenceFrequency" IS NULL) OR
    ("isRecurring" = TRUE AND "recurrenceFrequency" IN ('weekly', 'biweekly', 'monthly', 'yearly'))
  );

-- Create index for recurring entries lookup
CREATE INDEX IF NOT EXISTS "idx_entry_recurring" ON "Entry"("isRecurring", "recurrenceFrequency") WHERE "isRecurring" = TRUE;

