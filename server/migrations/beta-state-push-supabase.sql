-- Beta State Push - Supabase Migration
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    branding_logo TEXT,
    branding_primary_color TEXT DEFAULT '#3B82F6',
    branding_secondary_color TEXT DEFAULT '#6366F1',
    plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
    max_players INTEGER DEFAULT 5,
    max_users INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE PUBLIC USERS TABLE
-- ============================================================================
-- Supabase Auth stores users in auth.users (private schema)
-- We create a public.users table that references auth.users for our app data

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'manager', 'viewer', 'integrations', 'odsadmin', 'odstech')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to auto-create public.users when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. TECH ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tech_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tech_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tech_user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_tech_assignments_tech ON tech_assignments(tech_user_id);
CREATE INDEX IF NOT EXISTS idx_tech_assignments_org ON tech_assignments(organization_id);

-- ============================================================================
-- 4. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'deploy', 'view')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('player', 'playlist', 'content', 'user', 'organization', 'group', 'template')),
    resource_id TEXT,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZATIONS RLS POLICIES
-- ============================================================================

-- Users can view their own organization
CREATE POLICY "Users view own organization"
ON organizations FOR SELECT
USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ODSAdmin can view all organizations
CREATE POLICY "ODSAdmin view all organizations"
ON organizations FOR SELECT
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'odsadmin');

-- ODSTech can view assigned organizations
CREATE POLICY "ODSTech view assigned organizations"
ON organizations FOR SELECT
USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'odstech'
    AND id IN (
        SELECT organization_id 
        FROM tech_assignments 
        WHERE tech_user_id = auth.uid()
    )
);

-- Owners can update their organization
CREATE POLICY "Owners update own organization"
ON organizations FOR UPDATE
USING (
    id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
);

-- ============================================================================
-- USERS RLS POLICIES
-- ============================================================================

-- Users can view users in their organization
CREATE POLICY "Users view org members"
ON users FOR SELECT
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ODSAdmin can view all users
CREATE POLICY "ODSAdmin view all users"
ON users FOR SELECT
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'odsadmin');

-- ODSTech can view users in assigned orgs
CREATE POLICY "ODSTech view assigned org users"
ON users FOR SELECT
USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'odstech'
    AND organization_id IN (
        SELECT organization_id 
        FROM tech_assignments 
        WHERE tech_user_id = auth.uid()
    )
);

-- Owners and Managers can update org users
CREATE POLICY "Owners and Managers update org users"
ON users FOR UPDATE
USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'manager')
);

-- ============================================================================
-- TECH ASSIGNMENTS RLS POLICIES
-- ============================================================================

-- ODSAdmin can view all tech assignments
CREATE POLICY "ODSAdmin view all tech assignments"
ON tech_assignments FOR SELECT
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'odsadmin');

-- ODSTech can view their own assignments
CREATE POLICY "ODSTech view own assignments"
ON tech_assignments FOR SELECT
USING (tech_user_id = auth.uid());

-- ODSAdmin can manage tech assignments
CREATE POLICY "ODSAdmin manage tech assignments"
ON tech_assignments FOR ALL
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'odsadmin');

-- ============================================================================
-- AUDIT LOGS RLS POLICIES
-- ============================================================================

-- Users can view audit logs for their organization
CREATE POLICY "Users view own org audit logs"
ON audit_logs FOR SELECT
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ODSAdmin can view all audit logs
CREATE POLICY "ODSAdmin view all audit logs"
ON audit_logs FOR SELECT
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'odsadmin');

-- ODSTech can view audit logs for assigned orgs
CREATE POLICY "ODSTech view assigned org audit logs"
ON audit_logs FOR SELECT
USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'odstech'
    AND organization_id IN (
        SELECT organization_id 
        FROM tech_assignments 
        WHERE tech_user_id = auth.uid()
    )
);

-- System can insert audit logs (bypass RLS for audit middleware)
CREATE POLICY "System insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for organizations
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Create ODS Admin organization
INSERT INTO organizations (name, slug, plan_tier, max_players, max_users)
VALUES (
    'ODS Administration',
    'ods-admin',
    'enterprise',
    999,
    999
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify migration success:
-- SELECT * FROM organizations;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
-- SELECT * FROM tech_assignments;
-- SELECT * FROM audit_logs LIMIT 10;
