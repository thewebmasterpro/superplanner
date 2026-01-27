-- Superplanner V1 Migration: Statuses, Dates, and Recurrence
-- Execute this in the Supabase SQL Editor

-- 1. Update Status enum check constraint
-- First, find and drop the old constraint if it exists
DO $$ 
BEGIN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
END $$;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'cancelled'));

-- 2. Add US3: Blocked Reason
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- 3. Add US1: Completed At tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 4. Add US2: Recurrence Configuration
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) DEFAULT NULL 
CHECK (recurrence IN ('daily', 'weekly', 'biweekly', 'monthly'));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_day INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end DATE;

-- 5. Add index for sorting by due_date
CREATE INDEX IF NOT EXISTS tasks_due_date_active_idx ON tasks(due_date) WHERE status != 'done';

-- 6. Comments for documentation
COMMENT ON COLUMN tasks.blocked_reason IS 'Reason why a task is blocked';
COMMENT ON COLUMN tasks.completed_at IS 'When the task was actually finished';
COMMENT ON COLUMN tasks.recurrence IS 'Automation frequency (daily, weekly, etc.)';
