-- Team Invitations Table
-- Stores pending invitations for team members

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('standard', 'supervisor', 'odsmanager')),
  message TEXT,
  invited_by UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_org ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- Enable Row Level Security
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view invitations for their organization
CREATE POLICY "Users can view invitations for their organization"
  ON team_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can insert invitations
CREATE POLICY "Admins can insert invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('system', 'odsadmin', 'odsmanager')
    )
  );

-- Admins can update invitations
CREATE POLICY "Admins can update invitations"
  ON team_invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('system', 'odsadmin', 'odsmanager')
    )
  );

-- Admins can delete invitations
CREATE POLICY "Admins can delete invitations"
  ON team_invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('system', 'odsadmin', 'odsmanager')
    )
  );
