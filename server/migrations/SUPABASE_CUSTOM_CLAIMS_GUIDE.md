# Supabase Custom Claims Configuration Guide

## 🎯 Objective

Configure Supabase to inject custom claims (`organization_id`, `role`, `view_as`) into JWTs for tenant isolation and RBAC.

---

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ Auth enabled in Supabase
- ✅ Users table with `raw_user_meta_data` column
- ✅ Backend auth middleware ready ([server/middleware/auth.js](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/middleware/auth.js))

---

## 🚀 Step 1: Deploy Custom Claims Hook

### Option A: Via Supabase Dashboard (Recommended)

1. **Navigate to Hooks**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Click **Authentication** → **Hooks** (left sidebar)

2. **Create Custom Access Token Hook**
   - Click **"Add a new hook"**
   - Select **"Custom Access Token"** hook type
   - Name: `custom_access_token_hook`

3. **Paste Hook Function**
   - Copy the SQL from [supabase-custom-claims-hook.sql](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/migrations/supabase-custom-claims-hook.sql)
   - Paste into the SQL editor
   - Click **"Create hook"**

4. **Enable Hook**
   - Toggle the hook to **"Enabled"**
   - Verify status shows as **"Active"**

### Option B: Via SQL Editor

1. Open **SQL Editor** in Supabase Dashboard
2. Copy entire contents of [supabase-custom-claims-hook.sql](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/migrations/supabase-custom-claims-hook.sql)
3. Paste and execute
4. Navigate to **Authentication** → **Hooks** to verify hook is active

---

## 🧪 Step 2: Test Custom Claims

### 2.1 Update User Metadata

Run this SQL in Supabase SQL Editor:

```sql
-- Update a test user's metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', 'org-demo-001',
  'role', 'Owner',
  'email', email,
  'full_name', 'Test Owner'
)
WHERE email = 'test@example.com';
```

### 2.2 Log In and Verify JWT

1. **Log in** as the test user via your app
2. **Get the JWT** from browser:
   - Open DevTools → Application → Local Storage
   - Find `supabase.auth.token`
   - Copy the `access_token` value

3. **Decode JWT** at [jwt.io](https://jwt.io)
4. **Verify Claims** in payload:
   ```json
   {
     "aud": "authenticated",
     "exp": 1234567890,
     "sub": "user-uuid",
     "email": "test@example.com",
     "organization_id": "org-demo-001",
     "role": "Owner",
     "view_as": null
   }
   ```

### 2.3 Test Backend API

```bash
# Get JWT from browser
TOKEN="your-jwt-here"

# Test players API (should filter by org_id)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players

# Should return only players for org-demo-001
```

---

## 🔄 Step 3: Test View As Functionality

### 3.1 Create ODSAdmin User

```sql
-- Create ODSAdmin user
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', null,
  'role', 'ODSAdmin',
  'email', email,
  'full_name', 'Admin User'
)
WHERE email = 'admin@ods.com';
```

### 3.2 Switch to View As Mode

```bash
# Log in as ODSAdmin
# Get JWT
TOKEN="admin-jwt-here"

# Switch to View As Customer mode
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"customer","organization_id":"org-demo-001"}' \
  http://localhost:3001/api/view-as/switch

# Refresh session in browser
# Get new JWT
# Decode and verify view_as claim:
{
  "organization_id": null,
  "role": "ODSAdmin",
  "view_as": {
    "mode": "customer",
    "organization_id": "org-demo-001",
    "original_role": "ODSAdmin"
  }
}
```

### 3.3 Verify Tenant Isolation

```bash
# With View As active, test players API
curl -H "Authorization: Bearer $NEW_TOKEN" \
  http://localhost:3001/api/players

# Should return only players for org-demo-001
# Even though user is ODSAdmin
```

---

## 📊 Step 4: Seed Test Data

### 4.1 Create Organizations

```sql
-- Insert test organizations
INSERT INTO organizations (id, name, created_at, updated_at)
VALUES
  ('org-demo-001', 'Demo Org 1', NOW(), NOW()),
  ('org-demo-002', 'Demo Org 2', NOW(), NOW()),
  ('org-demo-003', 'Demo Org 3', NOW(), NOW());
```

### 4.2 Create Users for Each Role

```sql
-- Owner for Org 1
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', 'org-demo-001',
  'role', 'Owner',
  'email', email
)
WHERE email = 'owner@demo1.com';

-- Manager for Org 1
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', 'org-demo-001',
  'role', 'Manager',
  'email', email
)
WHERE email = 'manager@demo1.com';

-- Viewer for Org 1
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', 'org-demo-001',
  'role', 'Viewer',
  'email', email
)
WHERE email = 'viewer@demo1.com';

-- ODSTech with assignments
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', null,
  'role', 'ODSTech',
  'email', email
)
WHERE email = 'tech@ods.com';

-- Create tech assignment
INSERT INTO tech_assignments (id, tech_id, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'tech@ods.com'),
  'org-demo-001',
  NOW()
);
```

### 4.3 Seed Players with org_id

```sql
-- Add players for Org 1
INSERT INTO players (id, name, cpu_serial, org_id, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Player 1 - Org 1', 'CPU-001', 'org-demo-001', 'online', NOW(), NOW()),
  (gen_random_uuid(), 'Player 2 - Org 1', 'CPU-002', 'org-demo-001', 'offline', NOW(), NOW());

-- Add players for Org 2
INSERT INTO players (id, name, cpu_serial, org_id, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Player 1 - Org 2', 'CPU-003', 'org-demo-002', 'online', NOW(), NOW()),
  (gen_random_uuid(), 'Player 2 - Org 2', 'CPU-004', 'org-demo-002', 'online', NOW(), NOW());
```

---

## ✅ Step 5: End-to-End Testing

### Test Matrix

| Role | Org | Expected Behavior |
|------|-----|-------------------|
| **Owner** | org-demo-001 | ✅ See only Org 1 players<br>✅ Can create/edit/delete |
| **Manager** | org-demo-001 | ✅ See only Org 1 players<br>✅ Can create/edit<br>❌ Cannot delete |
| **Viewer** | org-demo-001 | ✅ See only Org 1 players<br>❌ Cannot create/edit/delete |
| **ODSAdmin** | null | ✅ See ALL players<br>✅ Can switch to View As |
| **ODSAdmin (View As Org 1)** | null → org-demo-001 | ✅ See only Org 1 players<br>✅ Actions logged to audit_logs |
| **ODSTech** | null | ✅ See only assigned org players<br>✅ Can switch between assigned orgs |

### Testing Checklist

- [ ] **Owner Login**
  - [ ] Can see only own org's players
  - [ ] Can create new player
  - [ ] Can edit player
  - [ ] Can delete player
  - [ ] Cannot see other orgs' players

- [ ] **Manager Login**
  - [ ] Can see only own org's players
  - [ ] Can create new player
  - [ ] Can edit player
  - [ ] Cannot delete player (403 error)

- [ ] **Viewer Login**
  - [ ] Can see only own org's players
  - [ ] Cannot create player (403 error)
  - [ ] Cannot edit player (403 error)
  - [ ] Cannot delete player (403 error)

- [ ] **ODSAdmin Login**
  - [ ] Can see ALL orgs' players
  - [ ] Can switch to "View As Tech" mode
  - [ ] Can switch to "View As Customer" mode
  - [ ] View As actions logged to audit_logs

- [ ] **ODSTech Login**
  - [ ] Can see only assigned org players
  - [ ] Can switch between assigned orgs
  - [ ] Cannot see unassigned orgs

---

## 🐛 Troubleshooting

### JWT Missing Custom Claims

**Problem:** JWT doesn't include `organization_id` or `role`

**Solutions:**
1. Verify hook is **enabled** in Supabase Dashboard
2. Check user's `raw_user_meta_data` has correct fields:
   ```sql
   SELECT raw_user_meta_data FROM auth.users WHERE email = 'test@example.com';
   ```
3. Force session refresh:
   ```typescript
   import { supabase } from '@/lib/supabase';
   await supabase.auth.refreshSession();
   ```
4. Check hook function logs in Supabase Dashboard → Logs

### 401 Unauthorized Errors

**Problem:** API returns 401 even with valid JWT

**Solutions:**
1. Verify `SUPABASE_JWT_SECRET` in `.env` matches Supabase project
2. Check JWT expiration (decode at jwt.io)
3. Verify `authMiddleware` is applied to route in `server/index.js`

### Tenant Isolation Not Working

**Problem:** Users can see other orgs' data

**Solutions:**
1. Verify `organization_id` claim is in JWT
2. Check route has tenant filtering logic:
   ```javascript
   const orgId = req.user.effective_organization_id;
   const items = db.prepare('SELECT * FROM table WHERE org_id = ?').all(orgId);
   ```
3. Verify `req.user` is populated by `authMiddleware`

### View As Not Working

**Problem:** View As mode doesn't change visible data

**Solutions:**
1. Verify `view_as` claim is in JWT after switching
2. Force session refresh after calling `/api/view-as/switch`
3. Check `effective_organization_id` is used in queries:
   ```javascript
   const orgId = req.user.effective_organization_id; // Respects view_as
   ```

---

## 📚 Related Files

- [supabase-custom-claims-hook.sql](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/migrations/supabase-custom-claims-hook.sql) - Hook SQL
- [server/middleware/auth.js](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/middleware/auth.js) - Auth middleware
- [server/routes/view-as.js](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/routes/view-as.js) - View As API
- [dashboard/lib/auth.ts](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/lib/auth.ts) - Frontend auth utils
- [dashboard/components/AuthProvider.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/AuthProvider.tsx) - Auth context

---

## 🎉 Success Criteria

- ✅ JWT includes `organization_id`, `role`, `view_as` claims
- ✅ Owner can CRUD own org resources
- ✅ Manager can create/edit but not delete
- ✅ Viewer is read-only
- ✅ ODSAdmin can see all orgs
- ✅ View As mode changes visible data
- ✅ View As actions logged to audit_logs
- ✅ Tenant isolation: no data leaks between orgs
