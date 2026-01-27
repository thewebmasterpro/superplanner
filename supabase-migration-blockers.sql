-- Blockers (Task Dependencies) Migration
-- Execute in Supabase SQL Editor

-- 1. Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,      -- Task that is blocked
  blocker_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,   -- Task that blocks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(task_id, blocker_id),
  CHECK (task_id != blocker_id)  -- No self-blocking
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocker_id ON task_dependencies(blocker_id);

-- 3. RLS Policies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Users can only manage dependencies for their own tasks
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'task_dependencies' AND policyname = 'Users can manage their task dependencies'
    ) THEN
        CREATE POLICY "Users can manage their task dependencies" ON task_dependencies
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM tasks t 
                WHERE t.id = task_dependencies.task_id 
                AND t.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM tasks t 
                WHERE t.id = task_dependencies.task_id 
                AND t.user_id = auth.uid()
            )
        );
    END IF;
END $$;
