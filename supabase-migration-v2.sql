-- Superplanner V2 Migration: Context & Tracking
-- Execute this in the Supabase SQL Editor

-- ==========================================
-- 1. US4: Tags & Labels
-- ==========================================

-- Create Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Create Junction table for Many-to-Many relationship (Tasks <-> Tags)
CREATE TABLE IF NOT EXISTS task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (task_id, tag_id)
);

-- RLS for Tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can manage their own tags'
    ) THEN
        CREATE POLICY "Users can manage their own tags"
          ON tags FOR ALL
          TO authenticated
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- RLS for Task Tags
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'task_tags' AND policyname = 'Users can manage tags on their tasks'
    ) THEN
        CREATE POLICY "Users can manage tags on their tasks"
          ON task_tags FOR ALL
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM tasks WHERE id = task_tags.task_id AND user_id = auth.uid()
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM tasks WHERE id = task_tags.task_id AND user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- ==========================================
-- 2. US6: Notes & Comments
-- ==========================================

CREATE TABLE IF NOT EXISTS task_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for Notes
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'task_notes' AND policyname = 'Users can manage notes on their tasks'
    ) THEN
        CREATE POLICY "Users can manage notes on their tasks"
          ON task_notes FOR ALL
          TO authenticated
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ==========================================
-- 3. US7: Time Tracking
-- ==========================================

CREATE TABLE IF NOT EXISTS task_time_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE, -- Null means currently running
  duration_seconds INTEGER DEFAULT 0, -- Calculated on stop
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for Time Logs
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'task_time_logs' AND policyname = 'Users can manage time logs on their tasks'
    ) THEN
        CREATE POLICY "Users can manage time logs on their tasks"
          ON task_time_logs FOR ALL
          TO authenticated
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS tags_user_id_idx ON tags(user_id);
CREATE INDEX IF NOT EXISTS task_notes_task_id_idx ON task_notes(task_id);
CREATE INDEX IF NOT EXISTS task_time_logs_task_id_idx ON task_time_logs(task_id);

-- ==========================================
-- 4. US12: Meetings Management
-- ==========================================

-- Add 'agenda' column for meeting notes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS agenda TEXT;

-- Add 'type' column to distinguish Task vs Meeting
-- We use a text column with a check constraint for simplicity + flexibility
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'task';

-- Safely add the check constraint
DO $$ 
BEGIN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;
    ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type IN ('task', 'meeting'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Add index on type for faster filtering
CREATE INDEX IF NOT EXISTS tasks_type_idx ON tasks(type);

-- ==========================================
-- 5. US12B: Meeting Agenda Items (Sub-tasks)
-- ==========================================

-- Add parent_meeting_id for sub-tasks/agenda items
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_meeting_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Add assigned_to for task assignment
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS tasks_parent_meeting_id_idx ON tasks(parent_meeting_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
