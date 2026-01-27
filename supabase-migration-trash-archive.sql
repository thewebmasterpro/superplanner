-- Migration: Add Trash and Archive support
-- Adds deleted_at and archived_at columns to tasks table

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index for performance when filtering (since we will almost always filter these)
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON tasks(archived_at);

-- Update RLS policies to allow access (though current user policy often covers 'all', filtering happens in app)
-- Users can see their own deleted/archived tasks
-- Existing policy "Users can manage their own tasks" usually checks (user_id = auth.uid()) which covers this.

-- Force reload schema cache
NOTIFY pgrst, 'reload config';
