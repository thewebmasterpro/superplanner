-- Fix RLS Infinite Recursion

-- 1. Create a secure function to check team membership without recursion
-- owning_user should be a superuser or the role that deployed the tables (which usually bypasses RLS)
-- SECURITY DEFINER means the function runs with the privileges of the creator
CREATE OR REPLACE FUNCTION public.check_is_team_member(_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM team_members
    WHERE team_id = _team_id
    AND user_id = auth.uid()
  );
END;
$$;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Members can view team roster" ON team_members;
DROP POLICY IF EXISTS "Owners/Admins can manage members" ON team_members;

-- 3. Re-create policies using the secure function

-- Policy: I can view rows if I am in the same team as that row
CREATE POLICY "Members can view team roster" ON team_members
FOR SELECT TO authenticated
USING (
  public.check_is_team_member(team_id) -- Uses Security Definer function to break recursion
);

-- Policy: I can manage members if I am an owner/admin of that team
-- Note: Requires checking my role. Creating a helper for that too is safer, or just querying inside the function.
CREATE OR REPLACE FUNCTION public.check_can_manage_team(_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM team_members
    WHERE team_id = _team_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$;

CREATE POLICY "Owners/Admins can manage members" ON team_members
FOR ALL TO authenticated
USING (
  public.check_can_manage_team(team_id)
);
