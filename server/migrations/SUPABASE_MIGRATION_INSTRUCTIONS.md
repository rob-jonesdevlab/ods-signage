# Supabase Migration Instructions

## 🎯 Overview

The Beta State Push uses a **hybrid database architecture**:
- **Supabase**: Organizations, users, tech_assignments, audit_logs (with RLS for multi-tenancy)
- **SQLite**: Players, content, playlists, groups, templates, analytics (for low-latency operations)

## ✅ SQLite Migration - COMPLETED

The SQLite migration has been run successfully:
- ✅ Created `player_groups` table
- ✅ Created `playlist_templates` table  
- ✅ Created `player_analytics` table
- ✅ Modified `players` table (added organization_id, group_id)
- ✅ Modified `content` table (added organization_id)
- ✅ Modified `playlists` table (added organization_id)

## 📋 Supabase Migration - NEXT STEP

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration

1. Open the migration file: `server/migrations/beta-state-push-supabase.sql`
2. Copy the entire SQL script
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Migration

Run these verification queries in the SQL Editor:

```sql
-- Check organizations table
SELECT * FROM organizations;

-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check tech_assignments table
SELECT * FROM tech_assignments;

-- Check audit_logs table
SELECT * FROM audit_logs LIMIT 10;

-- Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('organizations', 'users', 'tech_assignments', 'audit_logs');
```

### Step 4: Seed Initial Data (Optional)

The migration includes a seed for the ODS Admin organization. You can add more test data:

```sql
-- Create a test organization
INSERT INTO organizations (name, slug, plan_tier)
VALUES ('Test Company', 'test-company', 'pro');

-- Create a test user (use existing auth.users id)
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'test-company'),
    role = 'owner'
WHERE id = 'YOUR_USER_ID_HERE';
```

## 🔍 What the Migration Creates

### Tables Created:
1. **organizations** - Multi-tenant organization data
2. **tech_assignments** - ODSTech → Organization assignments
3. **audit_logs** - Compliance audit trail

### Tables Modified:
1. **users** - Added: organization_id, role, is_active, last_login_at

### RLS Policies Created:
- **Organizations**: Users see own org, ODSAdmin sees all, ODSTech sees assigned
- **Users**: Scoped by organization with role-based access
- **Tech Assignments**: ODSAdmin manages, ODSTech views own
- **Audit Logs**: Scoped by organization, system can insert

## ⚠️ Important Notes

1. **Existing Users**: After migration, existing users will have `NULL` organization_id. You'll need to assign them to organizations.

2. **RLS Enforcement**: All queries will be filtered by organization_id automatically via RLS policies.

3. **JWT Claims**: The dashboard will need to include `organization_id` and `role` in JWT claims for RLS to work.

4. **Backup**: Always backup your Supabase database before running migrations.

## 🚀 Next Steps After Migration

1. Update authentication to include organization_id and role in JWT
2. Create seed data for testing (organizations, users, tech assignments)
3. Test RLS policies with different roles
4. Begin Phase 2: Player Groups & Templates frontend implementation

## 🆘 Troubleshooting

**Error: "relation already exists"**
- The table already exists. You can skip that section or use `DROP TABLE IF EXISTS` (be careful!).

**Error: "column already exists"**
- The column was added in a previous migration. Safe to ignore.

**RLS policies not working**
- Verify JWT claims include `organization_id` and `role`
- Check policy conditions match your JWT structure
- Use `SELECT auth.uid()` to debug current user ID

**Need to rollback?**
```sql
-- Drop tables (WARNING: This deletes all data!)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS tech_assignments CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Remove columns from users
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;
ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
```
