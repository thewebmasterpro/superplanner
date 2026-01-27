-- Superplanner FULL V1 RECOVERY MIGRATION
-- Execute this in the Supabase SQL Editor (https://app.supabase.com)
-- This script ensures all tables and columns needed for V1 (Categories, Projects, Recurrence) are present.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Categories Table (task_categories)
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#667eea',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, name)
);

-- 4. Tasks Table Enhancements
-- (Run these individually if they exist, or safely via DO blocks/IF NOT EXISTS)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end DATE;

-- Update status check if necessary
DO $$ 
BEGIN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'cancelled'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 5. Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies for Projects
DO $$ BEGIN
    CREATE POLICY "Users can manage their own projects" ON projects FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- Policies for Categories
DO $$ BEGIN
    CREATE POLICY "Users can manage their own categories" ON task_categories FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- Policies for Tasks (Standard RLS)
DO $$ BEGIN
    CREATE POLICY "Users can manage their own tasks" ON tasks FOR ALL TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- 6. Default Project Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.projects (user_id, name, slug)
  VALUES (NEW.id, 'Mon Premier Projet', 'default-' || NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (Drop and Create)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
