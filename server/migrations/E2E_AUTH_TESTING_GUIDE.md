# End-to-End Authentication Testing Guide

**Complete testing procedure for Phase 5 authentication and tenant isolation**

---

## 🎯 Testing Objectives

1. ✅ Verify Supabase custom claims hook is working
2. ✅ Verify JWT includes `organization_id`, `role`, `view_as`
3. ✅ Verify tenant isolation (no data leaks between orgs)
4. ✅ Verify RBAC enforcement (Owner/Manager/Viewer permissions)
5. ✅ Verify View As functionality (ODSAdmin/ODSTech)
6. ✅ Verify audit logging for View As actions

---

## 📋 Prerequisites

- [x] Supabase custom claims hook deployed
- [x] All 6 API routes have tenant filtering
- [x] Auth middleware configured
- [x] Frontend AuthProvider integrated
- [ ] Test data created (run `test-auth-setup.sql`)

---

## 🚀 Step 1: Create Test Data

### 1.1 Run SQL Script

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of [`test-auth-setup.sql`](./test-auth-setup.sql)
3. Execute the script
4. Verify organizations created (3 orgs)

### 1.2 Create Test Users

**Via Supabase Dashboard → Authentication → Users:**

Create 6 test users:
1. `owner@demo1.com` (password: `TestPass123!`)
2. `manager@demo1.com` (password: `TestPass123!`)
3. `viewer@demo1.com` (password: `TestPass123!`)
4. `owner@demo2.com` (password: `TestPass123!`)
5. `admin@ods.com` (password: `TestPass123!`)
6. `tech@ods.com` (password: `TestPass123!`)

### 1.3 Update User Metadata

Run the UPDATE queries from `test-auth-setup.sql` to set:
- `organization_id`
- `role`
- `full_name`

### 1.4 Verify Setup

```sql
-- Check user metadata
SELECT 
  email,
  raw_user_meta_data->>'organization_id' as org_id,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email LIKE '%demo%' OR email LIKE '%ods.com'
ORDER BY email;
```

Expected output:
```
admin@ods.com      | null          | ODSAdmin
manager@demo1.com  | org-demo-001  | Manager
owner@demo1.com    | org-demo-001  | Owner
owner@demo2.com    | org-demo-002  | Owner
tech@ods.com       | null          | ODSTech
viewer@demo1.com   | org-demo-001  | Viewer
```

---

## 🧪 Step 2: Verify JWT Claims

### 2.1 Log In as Owner (Org 1)

1. Navigate to `http://localhost:3000/login`
2. Log in as `owner@demo1.com`
3. Open DevTools → Application → Local Storage
4. Find `supabase.auth.token` → Copy `access_token`

### 2.2 Decode JWT

1. Go to [jwt.io](https://jwt.io)
2. Paste the access token
3. **Verify payload includes:**

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid",
  "email": "owner@demo1.com",
  "organization_id": "org-demo-001",  // ✅ Custom claim
  "role": "Owner",                     // ✅ Custom claim
  "view_as": null                      // ✅ Custom claim
}
```

### 2.3 Repeat for All Roles

Test each user and verify correct claims:

| Email | organization_id | role | view_as |
|-------|----------------|------|---------|
| owner@demo1.com | org-demo-001 | Owner | null |
| manager@demo1.com | org-demo-001 | Manager | null |
| viewer@demo1.com | org-demo-001 | Viewer | null |
| owner@demo2.com | org-demo-002 | Owner | null |
| admin@ods.com | null | ODSAdmin | null |
| tech@ods.com | null | ODSTech | null |

---

## 🔒 Step 3: Test Tenant Isolation

### 3.1 Test Owner (Org 1)

**Log in as:** `owner@demo1.com`

**Test Players API:**
```bash
# Get JWT from browser
TOKEN="your-jwt-here"

# Test GET /api/players
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players
```

**Expected Result:**
- ✅ Returns 3 players (Org 1 only)
- ❌ Does NOT return Org 2 or Org 3 players

**Verify in Response:**
```json
[
  {"id": "...", "name": "Player 1 - Org 1", "org_id": "org-demo-001"},
  {"id": "...", "name": "Player 2 - Org 1", "org_id": "org-demo-001"},
  {"id": "...", "name": "Player 3 - Org 1", "org_id": "org-demo-001"}
]
```

### 3.2 Test Owner (Org 2)

**Log in as:** `owner@demo2.com`

**Test Players API:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players
```

**Expected Result:**
- ✅ Returns 2 players (Org 2 only)
- ❌ Does NOT return Org 1 or Org 3 players

### 3.3 Test ODSAdmin

**Log in as:** `admin@ods.com`

**Test Players API:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players
```

**Expected Result:**
- ✅ Returns ALL 6 players (all orgs)
- ✅ Can see Org 1, Org 2, and Org 3 players

### 3.4 Test ODSTech

**Log in as:** `tech@ods.com`

**Test Players API:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players
```

**Expected Result:**
- ✅ Returns 3 players (Org 1 only - assigned org)
- ❌ Does NOT return Org 2 or Org 3 players

---

## 🛡️ Step 4: Test RBAC Enforcement

### 4.1 Test Owner Permissions

**Log in as:** `owner@demo1.com`

**Test CREATE (POST):**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Player","cpu_serial":"CPU-TEST-001"}' \
  http://localhost:3001/api/players
```

**Expected:** ✅ 200 OK - Player created with auto-injected `org_id`

**Test DELETE:**
```bash
# Get a player ID from GET /api/players
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players/PLAYER_ID
```

**Expected:** ✅ 200 OK - Player deleted

### 4.2 Test Manager Permissions

**Log in as:** `manager@demo1.com`

**Test CREATE (POST):**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Manager Test","cpu_serial":"CPU-MGR-001"}' \
  http://localhost:3001/api/players
```

**Expected:** ✅ 200 OK - Player created

**Test DELETE:**
```bash
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players/PLAYER_ID
```

**Expected:** ❌ 403 Forbidden - "Insufficient permissions"

### 4.3 Test Viewer Permissions

**Log in as:** `viewer@demo1.com`

**Test GET:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players
```

**Expected:** ✅ 200 OK - Can view players

**Test CREATE (POST):**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Viewer Test","cpu_serial":"CPU-VWR-001"}' \
  http://localhost:3001/api/players
```

**Expected:** ❌ 403 Forbidden - "Insufficient permissions"

---

## 🎭 Step 5: Test View As Functionality

### 5.1 Test ODSAdmin View As Customer

**Log in as:** `admin@ods.com`

**1. Get current state:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/view-as/current
```

**Expected:** `{"view_as": null}`

**2. Switch to View As Org 1:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"customer","organization_id":"org-demo-001"}' \
  http://localhost:3001/api/view-as/switch
```

**Expected:** ✅ 200 OK - User metadata updated

**3. Refresh session in browser:**
- Log out and log back in, OR
- Call `supabase.auth.refreshSession()` in console

**4. Get new JWT and decode:**
```json
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

**5. Test Players API:**
```bash
curl -H "Authorization: Bearer $NEW_TOKEN" \
  http://localhost:3001/api/players
```

**Expected:** ✅ Returns only Org 1 players (3 players)

**6. Exit View As:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/view-as/exit
```

**7. Verify audit log:**
```sql
SELECT * FROM audit_logs
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@ods.com')
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** 2 entries (switch + exit)

### 5.2 Test ODSTech View As

**Log in as:** `tech@ods.com`

**1. Get available orgs:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/view-as/available
```

**Expected:** Only Org 1 (assigned org)

**2. Try to switch to unassigned org:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"customer","organization_id":"org-demo-002"}' \
  http://localhost:3001/api/view-as/switch
```

**Expected:** ❌ 403 Forbidden - "Not assigned to this organization"

**3. Switch to assigned org:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"customer","organization_id":"org-demo-001"}' \
  http://localhost:3001/api/view-as/switch
```

**Expected:** ✅ 200 OK

---

## 📊 Step 6: Test All Routes

Repeat tenant isolation tests for all 6 routes:

### 6.1 Players API
- ✅ GET /api/players - Tenant filtered
- ✅ POST /api/players - Auto-inject org_id
- ✅ DELETE /api/players/:id - Verify ownership

### 6.2 Playlists API
- ✅ GET /api/playlists - Tenant filtered
- ✅ POST /api/playlists - Auto-inject org_id
- ✅ DELETE /api/playlists/:id - Verify ownership

### 6.3 Player Groups API
- ✅ GET /api/player-groups - Tenant filtered
- ✅ POST /api/player-groups - Auto-inject organization_id

### 6.4 Content API
- ✅ GET /api/content - Tenant filtered
- ✅ POST /api/content - Auto-inject org_id
- ✅ DELETE /api/content/:id - Verify ownership

### 6.5 Folders API
- ✅ GET /api/folders - Tenant filtered
- ✅ POST /api/folders - Auto-inject org_id
- ✅ DELETE /api/folders/:id - Verify ownership

### 6.6 Playlist Templates API
- ✅ GET /api/playlist-templates - Tenant filtered
- ✅ POST /api/playlist-templates - Auto-inject organization_id
- ✅ DELETE /api/playlist-templates/:id - Verify ownership

---

## ✅ Success Criteria

### JWT Claims
- [x] JWT includes `organization_id`
- [x] JWT includes `role`
- [x] JWT includes `view_as`
- [x] Claims match user metadata

### Tenant Isolation
- [ ] Owner (Org 1) sees only Org 1 data
- [ ] Owner (Org 2) sees only Org 2 data
- [ ] ODSAdmin sees ALL data
- [ ] ODSTech sees only assigned org data
- [ ] No data leaks between orgs

### RBAC Enforcement
- [ ] Owner can create/edit/delete
- [ ] Manager can create/edit (NOT delete)
- [ ] Viewer can only read
- [ ] Proper 403 errors for unauthorized actions

### View As Functionality
- [ ] ODSAdmin can view as any org
- [ ] ODSTech can view as assigned orgs only
- [ ] JWT updated with `view_as` claim
- [ ] Audit logs capture View As actions
- [ ] Exit View As restores original state

### All Routes
- [ ] All 6 routes enforce tenant filtering
- [ ] All POST routes auto-inject org_id
- [ ] All DELETE routes verify ownership
- [ ] RBAC middleware applied correctly

---

## 🐛 Troubleshooting

### JWT Missing Custom Claims

**Problem:** JWT doesn't include `organization_id` or `role`

**Solutions:**
1. Verify hook is enabled in Supabase Dashboard
2. Check user metadata:
   ```sql
   SELECT raw_user_meta_data FROM auth.users WHERE email = 'test@example.com';
   ```
3. Force session refresh:
   ```javascript
   await supabase.auth.refreshSession();
   ```

### 401 Unauthorized

**Problem:** API returns 401 even with valid JWT

**Solutions:**
1. Verify `SUPABASE_JWT_SECRET` in `.env`
2. Check JWT expiration at jwt.io
3. Verify `authMiddleware` is applied to route

### Seeing Other Orgs' Data

**Problem:** User can see data from other organizations

**Solutions:**
1. Verify `organization_id` is in JWT
2. Check route has tenant filtering:
   ```javascript
   const orgId = req.user.effective_organization_id;
   const items = db.prepare('SELECT * FROM table WHERE org_id = ?').all(orgId);
   ```
3. Verify `req.user` is populated by `authMiddleware`

---

## 📝 Test Results Template

```markdown
# Phase 5 Authentication Testing Results

**Date:** YYYY-MM-DD
**Tester:** Your Name

## JWT Claims ✅/❌
- [ ] organization_id present
- [ ] role present
- [ ] view_as present

## Tenant Isolation ✅/❌
- [ ] Owner (Org 1) - isolated
- [ ] Owner (Org 2) - isolated
- [ ] ODSAdmin - sees all
- [ ] ODSTech - sees assigned only

## RBAC ✅/❌
- [ ] Owner - full access
- [ ] Manager - no delete
- [ ] Viewer - read only

## View As ✅/❌
- [ ] ODSAdmin - works
- [ ] ODSTech - restricted
- [ ] Audit logs - captured

## All Routes ✅/❌
- [ ] Players
- [ ] Playlists
- [ ] Player Groups
- [ ] Content
- [ ] Folders
- [ ] Playlist Templates

## Issues Found
1. [Issue description]
2. [Issue description]

## Notes
[Additional observations]
```

---

**Created:** February 11, 2026  
**Purpose:** Complete testing guide for Phase 5 authentication  
**Status:** Ready for execution
