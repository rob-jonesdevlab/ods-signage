-- Beta State Push - Seed Data
-- Run this in Supabase SQL Editor AFTER the main migration

-- ============================================================================
-- 1. CREATE TEST ORGANIZATIONS
-- ============================================================================

-- Organization 1: Retail Store Chain
INSERT INTO organizations (name, slug, plan_tier, max_players, max_users, branding_primary_color, branding_secondary_color)
VALUES (
    'Acme Retail',
    'acme-retail',
    'pro',
    25,
    10,
    '#EF4444',
    '#DC2626'
) ON CONFLICT (slug) DO NOTHING;

-- Organization 2: Restaurant Group
INSERT INTO organizations (name, slug, plan_tier, max_players, max_users, branding_primary_color, branding_secondary_color)
VALUES (
    'Tasty Bites Restaurant Group',
    'tasty-bites',
    'pro',
    15,
    5,
    '#F59E0B',
    '#D97706'
) ON CONFLICT (slug) DO NOTHING;

-- Organization 3: Corporate Office
INSERT INTO organizations (name, slug, plan_tier, max_players, max_users, branding_primary_color, branding_secondary_color)
VALUES (
    'TechCorp Industries',
    'techcorp',
    'enterprise',
    50,
    20,
    '#3B82F6',
    '#2563EB'
) ON CONFLICT (slug) DO NOTHING;

-- Organization 4: Small Business (Free Tier)
INSERT INTO organizations (name, slug, plan_tier, max_players, max_users)
VALUES (
    'Local Coffee Shop',
    'local-coffee',
    'free',
    3,
    2
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. CREATE TEST USERS
-- ============================================================================
-- NOTE: You'll need to create these users via Supabase Auth first, then update them here
-- This section shows the SQL to assign roles/orgs after auth users are created

-- Example: Assign existing auth user to Acme Retail as Owner
-- UPDATE users 
-- SET organization_id = (SELECT id FROM organizations WHERE slug = 'acme-retail'),
--     role = 'owner'
-- WHERE id = 'YOUR_AUTH_USER_ID_HERE';

-- ============================================================================
-- 3. CREATE ODS STAFF USERS
-- ============================================================================
-- These would be created via Supabase Auth, then updated here

-- Example: Create ODSAdmin user
-- UPDATE users 
-- SET role = 'odsadmin',
--     organization_id = (SELECT id FROM organizations WHERE slug = 'ods-admin')
-- WHERE id = 'ODS_ADMIN_AUTH_USER_ID';

-- Example: Create ODSTech user
-- UPDATE users 
-- SET role = 'odstech',
--     organization_id = (SELECT id FROM organizations WHERE slug = 'ods-admin')
-- WHERE id = 'ODS_TECH_AUTH_USER_ID';

-- ============================================================================
-- 4. CREATE TECH ASSIGNMENTS (ODSTech → Organizations)
-- ============================================================================
-- Assign ODSTech users to specific customer organizations

-- Example: Assign tech to Acme Retail and Tasty Bites
-- INSERT INTO tech_assignments (tech_user_id, organization_id, assigned_by)
-- VALUES 
--     ('ODS_TECH_AUTH_USER_ID', (SELECT id FROM organizations WHERE slug = 'acme-retail'), 'ODS_ADMIN_AUTH_USER_ID'),
--     ('ODS_TECH_AUTH_USER_ID', (SELECT id FROM organizations WHERE slug = 'tasty-bites'), 'ODS_ADMIN_AUTH_USER_ID');

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- View all organizations
SELECT id, name, slug, plan_tier, max_players, max_users FROM organizations ORDER BY created_at;

-- View all users with their organizations and roles
SELECT 
    u.id,
    u.role,
    o.name as organization_name,
    u.is_active,
    u.created_at
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at;

-- View tech assignments
SELECT 
    ta.id,
    u.id as tech_user_id,
    o.name as assigned_organization,
    ta.assigned_at
FROM tech_assignments ta
JOIN users u ON ta.tech_user_id = u.id
JOIN organizations o ON ta.organization_id = o.id
ORDER BY ta.assigned_at;

-- ============================================================================
-- 6. MANUAL STEPS TO COMPLETE SEED DATA
-- ============================================================================

/*
STEP 1: Create Auth Users in Supabase Dashboard
1. Go to Authentication > Users
2. Click "Add User"
3. Create users with emails:
   - admin@ods.local (ODSAdmin)
   - tech@ods.local (ODSTech)
   - owner@acme-retail.com (Acme Retail Owner)
   - manager@tasty-bites.com (Tasty Bites Manager)
   - viewer@techcorp.com (TechCorp Viewer)

STEP 2: Get User IDs
After creating users, run this query to get their IDs:
*/

SELECT id, email FROM auth.users ORDER BY created_at DESC;

/*
STEP 3: Assign Roles and Organizations
Copy the user IDs from above and run these updates:
*/

-- Assign ODSAdmin role
-- UPDATE users SET role = 'odsadmin', organization_id = (SELECT id FROM organizations WHERE slug = 'ods-admin') WHERE id = 'ADMIN_USER_ID';

-- Assign ODSTech role
-- UPDATE users SET role = 'odstech', organization_id = (SELECT id FROM organizations WHERE slug = 'ods-admin') WHERE id = 'TECH_USER_ID';

-- Assign Acme Retail Owner
-- UPDATE users SET role = 'owner', organization_id = (SELECT id FROM organizations WHERE slug = 'acme-retail') WHERE id = 'ACME_OWNER_USER_ID';

-- Assign Tasty Bites Manager
-- UPDATE users SET role = 'manager', organization_id = (SELECT id FROM organizations WHERE slug = 'tasty-bites') WHERE id = 'TASTY_MANAGER_USER_ID';

-- Assign TechCorp Viewer
-- UPDATE users SET role = 'viewer', organization_id = (SELECT id FROM organizations WHERE slug = 'techcorp') WHERE id = 'TECHCORP_VIEWER_USER_ID';

/*
STEP 4: Create Tech Assignments
Assign the ODSTech user to customer organizations:
*/

-- INSERT INTO tech_assignments (tech_user_id, organization_id, assigned_by)
-- VALUES 
--     ('TECH_USER_ID', (SELECT id FROM organizations WHERE slug = 'acme-retail'), 'ADMIN_USER_ID'),
--     ('TECH_USER_ID', (SELECT id FROM organizations WHERE slug = 'tasty-bites'), 'ADMIN_USER_ID');

/*
STEP 5: Verify Everything Works
Run the verification queries above to confirm:
- 5 organizations exist (including ODS Admin)
- 5+ users exist with correct roles and organizations
- Tech assignments exist for ODSTech user
*/
