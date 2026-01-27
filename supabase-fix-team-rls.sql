-- Fix Team RLS Policies to ensure owner visibility

-- Drop existing complex policy
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;

-- Re-create policy with explicit Owner check
-- This ensures the creator can ALWAYS see the team immediately, 
-- even before the team_members trigger fires.
CREATE POLICY "Users can view teams" ON teams
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
  )
);

-- Ensure Insert policy is definitely correct (re-apply to be safe)
DROP POLICY IF EXISTS "Users can create teams" ON teams;
CREATE POLICY "Users can create teams" ON teams
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());
