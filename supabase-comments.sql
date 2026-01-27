-- Task Comments Schema

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Policy: View comments
-- Users can view comments on tasks they have access to.
-- Since determining access to a task can be complex (Team membership vs Personal task),
-- we simplify by checking if the user can VIEW the parent task.
-- But standard RLS cross-table checks can be slow or recursive.
-- Simplified logic:
-- 1. If I am the creator of the comment (always)
-- 2. If I am owner of the task
-- 3. If the task is assigned to me
-- 4. If I am a member of the team the task belongs to (if team_id is set)

CREATE POLICY "Users can view comments on visible tasks" ON task_comments
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_comments.task_id
    AND (
      tasks.user_id = auth.uid() OR -- Task Owner
      tasks.assigned_to = auth.uid() OR -- Assigned User
      (tasks.team_id IS NOT NULL AND public.check_is_team_member(tasks.team_id)) -- Team Members (using helper)
    )
  )
);

-- Policy: Insert comments
-- Similar to view, if I can see the task, I can comment on it.
CREATE POLICY "Users can create comments on visible tasks" ON task_comments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_comments.task_id
    AND (
      tasks.user_id = auth.uid() OR
      tasks.assigned_to = auth.uid() OR
      (tasks.team_id IS NOT NULL AND public.check_is_team_member(tasks.team_id))
    )
  )
);

-- Policy: Update/Delete own comments
CREATE POLICY "Users can manage their own comments" ON task_comments
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
