# 🚀 Quick Start: Supabase Custom Claims

## ⚡ 5-Minute Setup

### Step 1: Create Function & Enable Hook (3 min)

**1A. Create Function (SQL Editor):**
1. Open [Supabase Dashboard](https://app.supabase.com) → SQL Editor
2. Click "New query"
3. Copy/paste from [supabase-custom-claims-hook.sql](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/migrations/supabase-custom-claims-hook.sql)
4. Click "Run" → Should see "Success. No rows returned"

**1B. Enable Hook (Auth → Hooks):**
1. Navigate to **Authentication** → **Hooks**
2. Click "Add a new hook" or "Enable hook"
3. **Hook type:** Postgres (default)
4. **Postgres Schema:** public (default)
5. **Postgres function:** Select `custom_access_token_hook` from dropdown
6. Toggle to **"Enabled"** (green) → Click "Create hook"

### Step 2: Update Test User (1 min)

Open **SQL Editor** in Supabase Dashboard and run:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'organization_id', 'org-demo-001',
  'role', 'Owner',
  'email', email,
  'full_name', 'Test Owner'
)
WHERE email = 'YOUR_TEST_EMAIL@example.com';
```

### Step 3: Verify JWT (2 min)

1. Log in to your app as the test user
2. Open DevTools → Application → Local Storage
3. Find `supabase.auth.token` → Copy `access_token`
4. Paste at [jwt.io](https://jwt.io)
5. **Verify claims:**
   ```json
   {
     "organization_id": "org-demo-001",
     "role": "Owner",
     "view_as": null
   }
   ```

---

## ✅ Quick Test: Tenant Isolation

```bash
# Get JWT from browser (see Step 3 above)
TOKEN="your-jwt-here"

# Test players API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players

# Should return only players for org-demo-001
```

---

## 📚 Full Documentation

For comprehensive setup, testing, and troubleshooting:
- [SUPABASE_CUSTOM_CLAIMS_GUIDE.md](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/migrations/SUPABASE_CUSTOM_CLAIMS_GUIDE.md)

For tenant filtering implementation details:
- [phase5_tenant_filtering_walkthrough.md](file:///Users/robert.leejones/.gemini/antigravity/brain/07d7b3a2-e44c-4ab4-9e03-72cb991097bc/phase5_tenant_filtering_walkthrough.md)

---

## 🐛 Quick Troubleshooting

**JWT missing claims?**
- Verify hook is **enabled** in Supabase Dashboard
- Check user metadata: `SELECT raw_user_meta_data FROM auth.users WHERE email = 'test@example.com';`
- Force session refresh in browser

**401 errors?**
- Verify `SUPABASE_JWT_SECRET` in `.env`
- Check JWT expiration at jwt.io

**Seeing other orgs' data?**
- Verify `organization_id` is in JWT
- Check route has tenant filtering (see walkthrough)

---

## 🎯 Next Steps

After Supabase hook is deployed and tested:

1. **Seed Test Data** - Create orgs, users, players with org_id
2. **Test All Roles** - Owner, Manager, Viewer, ODSAdmin, ODSTech
3. **Test View As** - ODSAdmin/ODSTech impersonation
4. **Verify Audit Logs** - View As actions logged

See [SUPABASE_CUSTOM_CLAIMS_GUIDE.md](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/migrations/SUPABASE_CUSTOM_CLAIMS_GUIDE.md) for detailed testing procedures.
