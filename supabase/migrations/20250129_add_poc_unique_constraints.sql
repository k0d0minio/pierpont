-- Add unique constraints to PointOfContact table
-- Note: NULL values are allowed, but non-NULL values must be unique

-- First, handle duplicate names by keeping the oldest record and updating references
-- This will merge duplicate POCs by keeping the one with the lowest ID
DO $$
DECLARE
  dup_record RECORD;
  keep_id INTEGER;
  dup_id INTEGER;
BEGIN
  -- Find duplicate names (case-insensitive)
  FOR dup_record IN 
    SELECT LOWER(TRIM("name")) as normalized_name, 
           array_agg("id" ORDER BY "id") as ids
    FROM "PointOfContact"
    WHERE "name" IS NOT NULL AND TRIM("name") != ''
    GROUP BY LOWER(TRIM("name"))
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first (oldest) ID, update all others
    keep_id := dup_record.ids[1];
    
    -- Update all entries referencing duplicate POCs to point to the kept one
    FOR i IN 2..array_length(dup_record.ids, 1) LOOP
      dup_id := dup_record.ids[i];
      -- Update Entry table references
      UPDATE "Entry" SET "pocId" = keep_id WHERE "pocId" = dup_id;
      -- Delete the duplicate POC
      DELETE FROM "PointOfContact" WHERE "id" = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- Handle duplicate emails (case-insensitive)
DO $$
DECLARE
  dup_record RECORD;
  keep_id INTEGER;
  dup_id INTEGER;
BEGIN
  FOR dup_record IN 
    SELECT LOWER(TRIM("email")) as normalized_email, 
           array_agg("id" ORDER BY "id") as ids
    FROM "PointOfContact"
    WHERE "email" IS NOT NULL AND TRIM("email") != ''
    GROUP BY LOWER(TRIM("email"))
    HAVING COUNT(*) > 1
  LOOP
    keep_id := dup_record.ids[1];
    FOR i IN 2..array_length(dup_record.ids, 1) LOOP
      dup_id := dup_record.ids[i];
      UPDATE "Entry" SET "pocId" = keep_id WHERE "pocId" = dup_id;
      DELETE FROM "PointOfContact" WHERE "id" = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- Handle duplicate phone numbers
DO $$
DECLARE
  dup_record RECORD;
  keep_id INTEGER;
  dup_id INTEGER;
BEGIN
  FOR dup_record IN 
    SELECT TRIM("phoneNumber") as normalized_phone, 
           array_agg("id" ORDER BY "id") as ids
    FROM "PointOfContact"
    WHERE "phoneNumber" IS NOT NULL AND TRIM("phoneNumber") != ''
    GROUP BY TRIM("phoneNumber")
    HAVING COUNT(*) > 1
  LOOP
    keep_id := dup_record.ids[1];
    FOR i IN 2..array_length(dup_record.ids, 1) LOOP
      dup_id := dup_record.ids[i];
      UPDATE "Entry" SET "pocId" = keep_id WHERE "pocId" = dup_id;
      DELETE FROM "PointOfContact" WHERE "id" = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- Now add unique constraints
-- Add unique constraint for name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_poc_name_unique" 
ON "PointOfContact" (LOWER(TRIM("name"))) 
WHERE "name" IS NOT NULL AND TRIM("name") != '';

-- Add unique constraint for email (case-insensitive, nulls allowed)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_poc_email_unique" 
ON "PointOfContact" (LOWER(TRIM("email"))) 
WHERE "email" IS NOT NULL AND TRIM("email") != '';

-- Add unique constraint for phoneNumber (nulls allowed)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_poc_phone_unique" 
ON "PointOfContact" (TRIM("phoneNumber")) 
WHERE "phoneNumber" IS NOT NULL AND TRIM("phoneNumber") != '';

