# Notifications Settings - Database Setup Guide

## Issue Summary
The Notifications Settings page is deployed but experiencing a **401 Unauthorized** error when trying to fetch/save notification preferences. This is caused by missing or incorrectly configured RLS (Row Level Security) policies on the `notification_preferences` table in Supabase.

## Root Cause
- **Error**: `TypeError: Failed to fetch` with HTTP 401 status
- **Endpoint**: `https://dimcecmdkoaxakknftwg.supabase.co/rest/v1/notification_preferences`
- **Cause**: RLS policies exist in the schema file but may not be properly applied in Supabase

## Fix Steps

### 1. Verify Table Exists
First, check that the table exists:

```sql
SELECT * FROM notification_preferences LIMIT 1;
```

✅ **Confirmed**: Table exists (user verified)

### 2. Check Current RLS Policies
Run this query to see what policies are currently active:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notification_preferences';
```

### 3. Apply/Re-apply RLS Policies
Run the following SQL in the Supabase SQL Editor to ensure all policies are correctly configured:

```sql
-- Enable RLS on the table
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;

-- Create SELECT policy
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Create UPDATE policy
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create INSERT policy
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4. Verify Policies Are Active
After running the above SQL, verify the policies are active:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'notification_preferences';
```

You should see:
- `Users can view own notification preferences` (SELECT)
- `Users can update own notification preferences` (UPDATE)
- `Users can insert own notification preferences` (INSERT)

### 5. Test the API
After applying the policies, test the page:
1. Navigate to https://ods-cloud.com/settings/notifications
2. Open browser DevTools → Network tab
3. Refresh the page
4. Look for the request to `notification_preferences`
5. It should return **200 OK** instead of **401 Unauthorized**

## Expected Behavior After Fix
- ✅ Page loads without console errors
- ✅ Notification preferences are fetched from the database
- ✅ Toggles can be changed and saved
- ✅ Success toast appears after saving
- ✅ Data persists after page refresh

## Additional Notes
- The table schema is correct and includes all necessary columns
- The frontend code is working correctly
- This is purely a database permission issue
