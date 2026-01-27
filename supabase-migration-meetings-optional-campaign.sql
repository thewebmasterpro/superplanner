-- Make campaign_id optional for meetings
-- Execute in Supabase SQL Editor BEFORE the meeting_items migration

-- 1. Make campaign_id nullable in meetings table
ALTER TABLE meetings ALTER COLUMN campaign_id DROP NOT NULL;

-- 2. Allow meetings without campaigns (update existing constraint if needed)
-- If there's a foreign key, it should already allow NULLs, 
-- but let's make sure the column itself accepts NULL values

-- Verify with:
-- SELECT column_name, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'meetings' AND column_name = 'campaign_id';
