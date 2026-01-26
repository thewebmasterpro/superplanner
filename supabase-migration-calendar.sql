-- Migration to add duration and scheduled_time to tasks
-- Run this in Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN tasks.duration IS 'Task duration in minutes';
COMMENT ON COLUMN tasks.scheduled_time IS 'When task is scheduled on calendar';
