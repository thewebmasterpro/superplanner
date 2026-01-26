-- Migration to add Categories and fix Project links
-- Execute this in the Supabase SQL Editor

-- 1. Create task_categories table
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#667eea',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, name)
);

-- 2. Add category_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- 3. Enable RLS on task_categories
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
  ON task_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON task_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON task_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON task_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Ensure we have at least one default project for existing users (if not handled by trigger)
-- This logic is usually in the trigger handle_new_user, but we can add manual ones if needed.
