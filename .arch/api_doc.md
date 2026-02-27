# ODS Signage (Dashboard) — API Documentation

> **Framework:** Next.js 14 (App Router)  
> **Deployment:** Vercel  
> **Auth:** Supabase Auth (email/password, OAuth)  
> **Data Access:** Direct Supabase client (no server-side API routes)  
> **API Server:** Consumes `ods-server-archaeopteryx` via fetch

---

## Architecture Note

ods-signage is a **frontend-only** application. It has **no server-side API routes** (`/app/api/*`).
All data access happens via two patterns:

1. **Supabase Direct** — Client-side Supabase SDK calls to tables/storage/auth
2. **Server API** — Fetch calls to `ods-server-archaeopteryx` (api.ods-cloud.com)

---

## Supabase Direct Client Functions

### Profile (`lib/api/profile.ts`)

| Function | Supabase Table/Storage | Purpose |
|----------|----------------------|---------|
| `updateProfile(userId, data)` | `profiles` UPDATE | Update user name, org, title, bio, phone, timezone, language |
| `uploadAvatar(userId, file)` | `avatars` bucket + `profiles` UPDATE | Upload avatar (2MB max, JPEG/PNG/WebP), store in storage, update profile URL |

### Team Management (`lib/api/team.ts`)

| Function | Supabase Table | Purpose |
|----------|---------------|---------|
| `getTeamMembers(orgId)` | `profiles` SELECT | List org members (id, email, name, role, avatar) |
| `inviteTeamMember(orgId, data, invitedBy)` | `team_invitations` INSERT | Create pending invitation (email, role, message) |
| `getPendingInvitations(orgId)` | `team_invitations` SELECT | List pending invites for org |
| `cancelInvitation(invitationId)` | `team_invitations` UPDATE | Set invitation status to 'cancelled' |
| `updateMemberRole(userId, role)` | `profiles` UPDATE | Change member's role |
| `removeMember(userId)` | `profiles` UPDATE | Set organization_id to null (removes from org) |

### Billing (`lib/api/billing.ts`)

| Function | Supabase Table | Purpose |
|----------|---------------|---------|
| `getCurrentSubscription(orgId)` | `subscriptions` SELECT | Get current plan (defaults to 'free' on error) |
| `getBillingHistory(orgId, limit)` | `invoices` SELECT | Get recent invoices |
| `updatePlan(orgId, planId)` | `subscriptions` UPSERT | Change subscription plan |
| `getUsageStats(orgId)` | — (mock) | Players/storage/users usage (currently mocked) |
| `getPaymentMethod()` | — (mock) | Payment card info (currently mocked) |

**Plan Tiers:** Free (1 player, 1GB, 1 user), Pro ($29/mo, 10 players, 50GB, 5 users), Enterprise ($99/mo, unlimited)

### API Keys (`lib/api/api-keys.ts`)

| Function | Purpose |
|----------|---------|
| API key CRUD | Generate/revoke API keys for programmatic access |

### Notifications (`lib/api/notifications.ts`)

| Function | Purpose |
|----------|---------|
| Notification preferences | Email/push notification settings |

### Security (`lib/api/security.ts`)

| Function | Purpose |
|----------|---------|
| Security settings | Password change, 2FA, session management |

---

## Server API Consumption

The dashboard consumes the following `ods-server-archaeopteryx` endpoints via fetch:

| Dashboard Page | Server Endpoint | Purpose |
|----------------|-----------------|---------|
| Players list | `GET /api/players` | Load all players |
| Player detail | `GET /api/players/:id` | Player info + status |
| Player settings | `PATCH /api/players/:id` | Update player config |
| Content library | `GET /api/content` | List uploaded content |
| Content upload | `POST /api/content` | Upload media files |
| Playlists | `GET /api/playlists` | List playlists |
| Playlist editor | `POST/PATCH/DELETE /api/playlists/:id/*` | Manage playlist content |
| Folders | `GET /api/folders/tree` | Content organization |
| Player groups | `GET /api/player-groups` | Group management |
| Analytics | `GET /api/analytics/*` | Dashboard metrics |
| Pairing | `POST /api/pairing/verify` | Enter pairing code from device |
| Audit logs | `GET /api/audit-logs` | Activity history |
| View-as | `POST /api/view-as/switch` | ODS staff impersonation |

---

## Supabase Auth Flow

```
1. User signs up → supabase.auth.signUp({ email, password })
2. Email verification → Supabase handles
3. Login → supabase.auth.signInWithPassword({ email, password })
4. Session → JWT token stored in browser, auto-refreshed
5. Server calls → JWT sent in Authorization header to archaeopteryx
```

---

## Supabase Tables Used by Dashboard

| Table | Operations | Purpose |
|-------|-----------|---------|
| `profiles` | CRUD | User profiles, avatars, roles |
| `team_invitations` | CRUD | Team member invitations |
| `subscriptions` | Read/Update | Billing plan state |
| `invoices` | Read | Billing history |
| `avatars` (storage) | Upload/Read | Profile images |

---

## Data Flow Summary

```
User → Dashboard (Next.js/Vercel)
          ├── Supabase Direct: Auth, Profiles, Teams, Billing
          └── Server API (api.ods-cloud.com): Players, Content, Playlists, Analytics
                    ├── Supabase (PostgreSQL): All persistent data
                    └── Socket.IO: Real-time player status
                              ↕
                         Player (atlas): Local device API + content rendering
```
