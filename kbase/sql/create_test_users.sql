-- ============================================
-- ODS Cloud Testing Users - Supabase Setup
-- ============================================
-- Creates three test users for end-to-end testing
-- All users assigned to demo-org-1
-- Password for all: tester345#

-- ============================================
-- STEP 1: Create Auth Users via Supabase Dashboard
-- ============================================
-- Go to: Supabase Dashboard > Authentication > Users > Add User
-- Create these three users manually:

/*
User 1 - Owner Tester:
  Email: ownertester@ods-cloud.com
  Password: tester345#
  Auto Confirm: YES

User 2 - Manager Tester:
  Email: managertester@ods-cloud.com
  Password: tester345#
  Auto Confirm: YES

User 3 - Viewer Tester:
  Email: viewertester@ods-cloud.com
  Password: tester345#
  Auto Confirm: YES
*/

-- ============================================
-- STEP 2: Get the Auth User IDs
-- ============================================
-- After creating users in dashboard, run this to get their IDs:

SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE email IN (
    'ownertester@ods-cloud.com',
    'managertester@ods-cloud.com',
    'viewertester@ods-cloud.com'
)
ORDER BY email;

-- Copy the UUIDs from the results above

-- ============================================
-- STEP 3: Verify demo-org-1 Exists
-- ============================================

SELECT id, name, slug, created_at 
FROM organizations 
WHERE slug = 'demo-org-1';

-- If demo-org-1 doesn't exist, create it:
/*
INSERT INTO organizations (id, name, slug, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Demo Organization 1',
    'demo-org-1',
    NOW(),
    NOW()
);
*/

-- ============================================
-- STEP 4: Create Profiles
-- ============================================
-- Replace the UUIDs below with actual values from STEP 2

-- Owner Tester Profile
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    created_at,
    updated_at
) VALUES (
    'PASTE_OWNERTESTER_UUID_HERE',  -- From auth.users query above
    'ownertester@ods-cloud.com',
    'Owner Tester',
    'owner',
    (SELECT id FROM organizations WHERE slug = 'demo-org-1'),
    NOW(),
    NOW()
);

-- Manager Tester Profile
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    created_at,
    updated_at
) VALUES (
    'PASTE_MANAGERTESTER_UUID_HERE',  -- From auth.users query above
    'managertester@ods-cloud.com',
    'Manager Tester',
    'manager',
    (SELECT id FROM organizations WHERE slug = 'demo-org-1'),
    NOW(),
    NOW()
);

-- Viewer Tester Profile
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    created_at,
    updated_at
) VALUES (
    'PASTE_VIEWERTESTER_UUID_HERE',  -- From auth.users query above
    'viewertester@ods-cloud.com',
    'Viewer Tester',
    'viewer',
    (SELECT id FROM organizations WHERE slug = 'demo-org-1'),
    NOW(),
    NOW()
);

-- ============================================
-- STEP 5: Verification
-- ============================================

-- Verify all profiles created successfully
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    o.name as organization_name,
    o.slug as organization_slug,
    p.created_at
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
WHERE p.email IN (
    'ownertester@ods-cloud.com',
    'managertester@ods-cloud.com',
    'viewertester@ods-cloud.com'
)
ORDER BY p.role DESC;

-- Expected result: 3 rows showing all users with demo-org-1

-- ============================================
-- ALTERNATIVE: Service Role Key Method
-- ============================================
-- If you have service role key access, you can use Supabase Admin API:

/*
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create Owner Tester
const { data: ownerUser, error: ownerError } = await supabase.auth.admin.createUser({
  email: 'ownertester@ods-cloud.com',
  password: 'tester345#',
  email_confirm: true
});

// Then create profile
await supabase.from('profiles').insert({
  id: ownerUser.user.id,
  email: 'ownertester@ods-cloud.com',
  full_name: 'Owner Tester',
  role: 'owner',
  organization_id: 'DEMO_ORG_ID'
});

// Repeat for manager and viewer...
*/

-- ============================================
-- TESTING CHECKLIST (as managertester)
-- ============================================
/*
Login as: managertester@ods-cloud.com
Password: tester345#

Test Flow:
1. ✓ Login to dashboard
2. ✓ Pair device to account
3. ✓ Create URL-based content in Content Library
4. ✓ Assign content to Playlist
5. ✓ Assign Player to playlist
6. ✓ Publish playlist to player

Expected Permissions (Manager Role):
✓ Can pair/unpair devices
✓ Can create/edit/delete content
✓ Can create/edit/delete playlists
✓ Can publish playlists
✗ Cannot manage users
✗ Cannot access billing
✗ Cannot see other organizations' data
*/

-- ============================================
-- ROLE PERMISSIONS MATRIX
-- ============================================
/*
| Action                    | Owner | Manager | Viewer |
|---------------------------|-------|---------|--------|
| View Content              |   ✓   |    ✓    |   ✓    |
| Create/Edit Content       |   ✓   |    ✓    |   ✗    |
| Delete Content            |   ✓   |    ✓    |   ✗    |
| View Playlists            |   ✓   |    ✓    |   ✓    |
| Create/Edit Playlists     |   ✓   |    ✓    |   ✗    |
| Publish Playlists         |   ✓   |    ✓    |   ✗    |
| View Players              |   ✓   |    ✓    |   ✓    |
| Pair/Unpair Devices       |   ✓   |    ✓    |   ✗    |
| Manage Users              |   ✓   |    ✗    |   ✗    |
| Manage Billing            |   ✓   |    ✗    |   ✗    |
| Organization Settings     |   ✓   |    ✗    |   ✗    |
*/

-- ============================================
-- CLEANUP (if needed)
-- ============================================
/*
-- Delete test users (run in reverse order)

-- Delete profiles first
DELETE FROM profiles 
WHERE email IN (
    'ownertester@ods-cloud.com',
    'managertester@ods-cloud.com',
    'viewertester@ods-cloud.com'
);

-- Then delete auth users (requires admin access)
-- Must be done via Supabase Dashboard or Admin API
*/
