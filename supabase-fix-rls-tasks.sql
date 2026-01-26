-- Superplanner RLS Fix for Tasks
-- Execute this in the Supabase SQL Editor

-- 1. OPTION A: Temporarily disable RLS for testing (NOT RECOMMENDED for production)
-- ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 2. OPTION B: Clean and fix policies (RECOMMENDED)

-- Drop existing task policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Everyone can view tasks" ON tasks;

-- Ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can only see their own tasks
CREATE POLICY "Users can view their own tasks"
ON tasks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for INSERT: Users can insert tasks for themselves
CREATE POLICY "Users can create their own tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own tasks
CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own tasks
CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Policy for SERVICE ROLE (Bypass)
-- No need to create a policy for Service Role, it bypasses RLS by default.
-- If your bot uses the SERVICE_ROLE_KEY, it will work without policies.
