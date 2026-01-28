-- Fix for Resend Email Logging
-- The current check constraint on 'tasks' table only allows ('task', 'meeting')
-- We need to allow 'email' so the edge function can log sent emails.

DO $$ 
BEGIN
    -- 1. Drop the existing constraint
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;
    
    -- 2. Add the new constraint with 'email' (and other useful CRM types)
    ALTER TABLE tasks ADD CONSTRAINT tasks_type_check 
    CHECK (type IN ('task', 'meeting', 'email', 'call', 'note', 'reminder'));
    
EXCEPTION
    WHEN others THEN NULL;
END $$;
