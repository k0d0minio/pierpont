-- Table configuration for golf/event entries (tables with guests per table)
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "tableBreakdown" JSONB;

-- Link reservation entries to a golf/event entry and optional table index
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "eventEntryId" INTEGER REFERENCES "Entry"("id") ON DELETE SET NULL;
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "tableIndex" SMALLINT;

CREATE INDEX IF NOT EXISTS "idx_entry_event_entry" ON "Entry"("eventEntryId");
