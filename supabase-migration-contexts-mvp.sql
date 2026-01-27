-- Contexts MVP Migration
-- Execute in Supabase SQL Editor

-- 1. Add missing columns to contexts table
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6366f1';
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'briefcase';
ALTER TABLE contexts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived'));

-- 2. Add context_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES contexts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tasks_context_id_idx ON tasks(context_id);

-- 3. Create initial contexts for the user (run after migration, replace USER_ID)
-- INSERT INTO contexts (user_id, name, description, color, icon) VALUES
--   ('YOUR_USER_ID', 'Distriweb', 'E-commerce Manager - Full-time job', '#22c55e', 'building'),
--   ('YOUR_USER_ID', 'Thewebmaster', 'Freelance web development', '#6366f1', 'code'),
--   ('YOUR_USER_ID', 'Agence-smith', 'Side project agency', '#f59e0b', 'rocket');
