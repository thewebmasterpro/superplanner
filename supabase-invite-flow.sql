-- Improved Invitation System

-- 1. Helper to find user by email (Security Definer needed to query auth.users)
-- This lookup is sensitive, so we wrap it inside the invite function, not exposed directly.

CREATE OR REPLACE FUNCTION public.invite_user_to_team(
  _team_id UUID,
  _email TEXT,
  _role TEXT DEFAULT 'member'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user_id UUID;
  is_member BOOLEAN;
  new_invite_id UUID;
BEGIN
  -- 1. Check if executing user has permission (is owner or admin)
  -- Uses the existing/helper check_can_manage_team if available, or manual check
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = _team_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can invite members';
  END IF;

  -- 2. Lookup user ID from email
  SELECT id INTO found_user_id FROM auth.users WHERE email = _email;

  -- 3. Check if user is already in the team
  IF found_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM team_members WHERE team_id = _team_id AND user_id = found_user_id
    ) INTO is_member;
    
    IF is_member THEN
      RETURN jsonb_build_object('status', 'already_member', 'message', 'User is already in the team');
    END IF;
  END IF;

  -- 4. Check if invite already exists
  IF EXISTS (
    SELECT 1 FROM team_invitations 
    WHERE team_id = _team_id AND email = _email AND accepted_at IS NULL
  ) THEN
     RETURN jsonb_build_object('status', 'already_invited', 'message', 'Invitation already pending');
  END IF;

  -- 5. Create Invitation
  INSERT INTO team_invitations (team_id, email, role, invited_by, token)
  VALUES (_team_id, _email, _role, auth.uid(), encode(gen_random_bytes(16), 'hex'))
  RETURNING id INTO new_invite_id;

  RETURN jsonb_build_object(
    'status', 'success', 
    'invite_id', new_invite_id, 
    'user_found', (found_user_id IS NOT NULL)
  );
END;
$$;

-- 2. Function to Accept Invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(_invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Get invite
  SELECT * INTO invite_record FROM team_invitations WHERE id = _invite_id;

  IF invite_record.id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Verify email matches current user
  IF invite_record.email != auth.email() THEN
    RAISE EXCEPTION 'This invitation does not belong to you';
  END IF;

  -- Add to team members
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (invite_record.team_id, auth.uid(), invite_record.role);

  -- Mark accepted
  UPDATE team_invitations SET accepted_at = NOW() WHERE id = _invite_id;

  RETURN TRUE;
END;
$$;

-- 3. RLS for viewing invitations
-- Allow users to see invitations sent to their email
CREATE POLICY "Users can view their own invitations" ON team_invitations
FOR SELECT TO authenticated
USING (email = auth.email());

-- Allow team admins to see invitations for their team
CREATE POLICY "Admins can view team invitations" ON team_invitations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_invitations.team_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
