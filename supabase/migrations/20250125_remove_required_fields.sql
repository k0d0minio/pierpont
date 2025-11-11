-- Remove required field constraints from Entry table
-- This migration ensures all user-facing fields are optional (nullable)
-- System fields (id, dayId, type, createdAt, updatedAt) remain NOT NULL

-- Note: Most fields are already nullable, but this migration explicitly
-- ensures any NOT NULL constraints on user-facing fields are removed

-- Make all user-facing Entry fields explicitly nullable
-- These ALTER statements will only affect columns that currently have NOT NULL constraints

ALTER TABLE "Entry" 
  ALTER COLUMN "size" DROP NOT NULL,
  ALTER COLUMN "label" DROP NOT NULL,
  ALTER COLUMN "source" DROP NOT NULL,
  ALTER COLUMN "title" DROP NOT NULL,
  ALTER COLUMN "participantsCount" DROP NOT NULL,
  ALTER COLUMN "time" DROP NOT NULL,
  ALTER COLUMN "startTime" DROP NOT NULL,
  ALTER COLUMN "endTime" DROP NOT NULL,
  ALTER COLUMN "location" DROP NOT NULL,
  ALTER COLUMN "capacity" DROP NOT NULL,
  ALTER COLUMN "notes" DROP NOT NULL,
  ALTER COLUMN "guestName" DROP NOT NULL,
  ALTER COLUMN "roomNumber" DROP NOT NULL,
  ALTER COLUMN "guestCount" DROP NOT NULL,
  ALTER COLUMN "description" DROP NOT NULL,
  ALTER COLUMN "phoneNumber" DROP NOT NULL,
  ALTER COLUMN "email" DROP NOT NULL;

-- Note: System fields remain NOT NULL:
-- - id (PRIMARY KEY)
-- - dayId (foreign key, required for entry to exist)
-- - type (required to identify entry type)
-- - createdAt, updatedAt (timestamps with defaults)

