-- Add isTourOperator field to Entry table
ALTER TABLE "Entry" ADD COLUMN "isTourOperator" BOOLEAN DEFAULT FALSE;
