-- Add recurrenceGroupId to ProgramItem for recurring series: one UUID per series,
-- so "all occurrences" is WHERE recurrenceGroupId = ? instead of title + frequency.
ALTER TABLE "ProgramItem" ADD COLUMN IF NOT EXISTS "recurrenceGroupId" UUID;
CREATE INDEX IF NOT EXISTS "idx_program_item_recurrence_group" ON "ProgramItem"("recurrenceGroupId") WHERE "recurrenceGroupId" IS NOT NULL;
