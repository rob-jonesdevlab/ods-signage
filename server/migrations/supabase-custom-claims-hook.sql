-- =============================================
-- Supabase Custom Access Token Hook
-- =============================================
-- This hook injects custom claims into JWTs:
-- - organization_id: User's organization
-- - role: User's role (Owner, Manager, Viewer, etc.)
-- - view_as: View As context (for ODS staff impersonation)
--
-- DEPLOYMENT INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Hooks
-- 2. Create a new "Custom Access Token" hook
-- 3. Paste the custom_access_token_hook function below
-- 4. Save and enable the hook
-- =============================================

-- Custom Access Token Hook Function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_id uuid;
  user_metadata jsonb;
  organization_id text;
  user_role text;
  view_as jsonb;
BEGIN
  -- Extract user ID from event
  user_id := (event->>'user_id')::uuid;
  
  -- Get user metadata from auth.users
  SELECT raw_user_meta_data INTO user_metadata
  FROM auth.users
  WHERE id = user_id;
  
  -- Extract custom claims from user metadata
  organization_id := user_metadata->>'organization_id';
  user_role := user_metadata->>'role';
  view_as := user_metadata->'view_as';
  
  -- Build claims object
  claims := jsonb_build_object(
    'organization_id', organization_id,
    'role', COALESCE(user_role, 'Viewer'),
    'view_as', view_as
  );
  
  -- Inject claims into JWT
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute permission to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke execute from public for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated;

-- =============================================
-- TESTING INSTRUCTIONS
-- =============================================
-- After deploying this hook:
--
-- 1. Update a user's metadata:
--    UPDATE auth.users
--    SET raw_user_meta_data = jsonb_build_object(
--      'organization_id', 'org-123',
--      'role', 'Owner'
--    )
--    WHERE email = 'test@example.com';
--
-- 2. Log in as that user
--
-- 3. Decode the JWT at jwt.io and verify claims:
--    {
--      "organization_id": "org-123",
--      "role": "Owner",
--      "view_as": null
--    }
--
-- 4. Test View As functionality:
--    - Call POST /api/view-as/switch
--    - Refresh session
--    - Decode JWT and verify view_as claim is populated
-- =============================================
