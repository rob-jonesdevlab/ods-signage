-- =============================================
-- Test Data Setup for Authentication Testing
-- =============================================
-- This script creates test organizations and users for
-- end-to-end authentication and tenant isolation testing.
--
-- USAGE:
-- 1. Run this in Supabase SQL Editor
-- 2. Create corresponding auth users via Supabase Dashboard
-- 3. Update user metadata with organization_id and role
-- 4. Test login and JWT claims
-- =============================================

-- Step 1: Create Test Organizations
-- =============================================
-- Note: We'll use gen_random_uuid() and then reference by name in subsequent queries

DO $$
DECLARE
  org1_id UUID;
  org2_id UUID;
  org3_id UUID;
BEGIN
  -- Check if organizations already exist
  SELECT id INTO org1_id FROM organizations WHERE slug = 'demo-org-1';
  SELECT id INTO org2_id FROM organizations WHERE slug = 'demo-org-2';
  SELECT id INTO org3_id FROM organizations WHERE slug = 'demo-org-3';
  
  -- Create organizations only if they don't exist
  IF org1_id IS NULL THEN
    INSERT INTO organizations (id, name, slug, plan_tier, max_players, max_users, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Demo Organization 1',
      'demo-org-1',
      'pro',
      10,
      5,
      NOW(),
      NOW()
    )
    RETURNING id INTO org1_id;
  END IF;
  
  IF org2_id IS NULL THEN
    INSERT INTO organizations (id, name, slug, plan_tier, max_players, max_users, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Demo Organization 2',
      'demo-org-2',
      'pro',
      10,
      5,
      NOW(),
      NOW()
    )
    RETURNING id INTO org2_id;
  END IF;
  
  IF org3_id IS NULL THEN
    INSERT INTO organizations (id, name, slug, plan_tier, max_players, max_users, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Demo Organization 3',
      'demo-org-3',
      'free',
      5,
      3,
      NOW(),
      NOW()
    )
    RETURNING id INTO org3_id;
  END IF;
  
  RAISE NOTICE 'Organization IDs:';
  RAISE NOTICE 'Org 1 (demo-org-1): %', org1_id;
  RAISE NOTICE 'Org 2 (demo-org-2): %', org2_id;
  RAISE NOTICE 'Org 3 (demo-org-3): %', org3_id;
END $$;

-- Step 2: Create Test Users (via Supabase Dashboard)
-- =============================================
-- You must create these users in Supabase Dashboard → Authentication → Users
-- Then update their metadata using the queries below.
--
-- Test Users to Create:
-- 1. owner@demo1.com (Owner, Org 1)
-- 2. manager@demo1.com (Manager, Org 1)
-- 3. viewer@demo1.com (Viewer, Org 1)
-- 4. owner@demo2.com (Owner, Org 2)
-- 5. admin@ods.com (ODSAdmin, no org)
-- 6. tech@ods.com (ODSTech, no org)

-- Step 3: Update User Metadata
-- =============================================
-- Run these AFTER creating users in Supabase Dashboard

-- Owner for Org 1
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', (SELECT id::text FROM organizations WHERE name = 'Demo Organization 1'),
  'role', 'Owner',
  'email', email,
  'full_name', 'Demo Owner 1'
)
WHERE email = 'owner@demo1.com';

-- Manager for Org 1
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', (SELECT id::text FROM organizations WHERE name = 'Demo Organization 1'),
  'role', 'Manager',
  'email', email,
  'full_name', 'Demo Manager 1'
)
WHERE email = 'manager@demo1.com';

-- Viewer for Org 1
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', (SELECT id::text FROM organizations WHERE name = 'Demo Organization 1'),
  'role', 'Viewer',
  'email', email,
  'full_name', 'Demo Viewer 1'
)
WHERE email = 'viewer@demo1.com';

-- Owner for Org 2
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', (SELECT id::text FROM organizations WHERE name = 'Demo Organization 2'),
  'role', 'Owner',
  'email', email,
  'full_name', 'Demo Owner 2'
)
WHERE email = 'owner@demo2.com';

-- ODSAdmin (no org)
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', NULL,
  'role', 'ODSAdmin',
  'email', email,
  'full_name', 'ODS Administrator'
)
WHERE email = 'admin@ods.com';

-- ODSTech (no org, but will have assignments)
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', NULL,
  'role', 'ODSTech',
  'email', email,
  'full_name', 'ODS Technician'
)
WHERE email = 'tech@ods.com';

-- Step 4: Create Tech Assignment
-- =============================================
-- NOTE: Run this AFTER creating users in Supabase Dashboard
-- The tech@ods.com user must exist before this can run

-- Uncomment and run this after creating users:
/*
INSERT INTO tech_assignments (id, tech_user_id, organization_id, assigned_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'tech@ods.com'),
  (SELECT id FROM organizations WHERE slug = 'demo-org-1'),
  NOW()
)
ON CONFLICT DO NOTHING;
*/

-- Step 5: Create Test Players
-- =============================================
-- Add test players for each organization

-- Players for Org 1
INSERT INTO players (id, name, cpu_serial, org_id, status, ip_address, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Player 1 - Org 1',
  'CPU-ORG1-001',
  id,
  'online',
  '192.168.1.101',
  NOW(),
  NOW()
FROM organizations WHERE name = 'Demo Organization 1'
ON CONFLICT (cpu_serial, org_id) DO NOTHING;

INSERT INTO players (id, name, cpu_serial, org_id, status, ip_address, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Player 2 - Org 1',
  'CPU-ORG1-002',
  id,
  'offline',
  '192.168.1.102',
  NOW(),
  NOW()
FROM organizations WHERE name = 'Demo Organization 1'
ON CONFLICT (cpu_serial, org_id) DO NOTHING;

INSERT INTO players (id, name, cpu_serial, org_id, status, ip_address, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Player 3 - Org 1',
  'CPU-ORG1-003',
  id,
  'online',
  '192.168.1.103',
  NOW(),
  NOW()
FROM organizations WHERE name = 'Demo Organization 1'
ON CONFLICT (cpu_serial, org_id) DO NOTHING;

-- Players for Org 2
INSERT INTO players (id, name, cpu_serial, org_id, status, ip_address, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Player 1 - Org 2',
  'CPU-ORG2-001',
  id,
  'online',
  '192.168.2.101',
  NOW(),
  NOW()
FROM organizations WHERE name = 'Demo Organization 2'
ON CONFLICT (cpu_serial, org_id) DO NOTHING;

INSERT INTO players (id, name, cpu_serial, org_id, status, ip_address, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Player 2 - Org 2',
  'CPU-ORG2-002',
  id,
  'online',
  '192.168.2.102',
  NOW(),
  NOW()
FROM organizations WHERE name = 'Demo Organization 2'
ON CONFLICT (cpu_serial, org_id) DO NOTHING;

-- Players for Org 3
INSERT INTO players (id, name, cpu_serial, org_id, status, ip_address, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Player 1 - Org 3',
  'CPU-ORG3-001',
  id,
  'online',
  '192.168.3.101',
  NOW(),
  NOW()
FROM organizations WHERE name = 'Demo Organization 3'
ON CONFLICT (cpu_serial, org_id) DO NOTHING;

-- Step 6: Verify Setup
-- =============================================

-- Check organizations
SELECT id, name FROM organizations ORDER BY name;

-- Check user metadata
SELECT 
  email,
  raw_user_meta_data->>'organization_id' as org_id,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email IN (
  'owner@demo1.com',
  'manager@demo1.com',
  'viewer@demo1.com',
  'owner@demo2.com',
  'admin@ods.com',
  'tech@ods.com'
)
ORDER BY email;

-- Check tech assignments
SELECT 
  ta.id,
  u.email as tech_email,
  o.name as org_name,
  o.slug as org_slug
FROM tech_assignments ta
JOIN auth.users u ON ta.tech_user_id = u.id
JOIN organizations o ON ta.organization_id = o.id;

-- Check players by org
SELECT 
  org_id,
  COUNT(*) as player_count
FROM players
GROUP BY org_id
ORDER BY org_id;

-- =============================================
-- TESTING INSTRUCTIONS
-- =============================================
-- 
-- After running this script:
--
-- 1. Create users in Supabase Dashboard (if not already created)
-- 2. Run the UPDATE queries to set user metadata
-- 3. Log in as each user via the dashboard
-- 4. Check JWT at jwt.io - should include:
--    - organization_id
--    - role
--    - view_as (null initially)
--
-- 5. Test API calls:
--    - Owner@demo1 should see 3 players (Org 1)
--    - Owner@demo2 should see 2 players (Org 2)
--    - Admin@ods should see ALL 6 players
--    - Tech@ods should see 3 players (Org 1 only)
--
-- 6. Test RBAC:
--    - Owner can create/edit/delete
--    - Manager can create/edit (NOT delete)
--    - Viewer can only read
--
-- 7. Test View As:
--    - Admin can switch to any org
--    - Tech can switch to assigned org only
--    - Check audit_logs for View As actions
--
-- =============================================
