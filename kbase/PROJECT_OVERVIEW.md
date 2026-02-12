# ODS Digital Signage Platform - Project Overview

**A Multi-Tenant SaaS Digital Signage Management System**

---

## 🎯 Project Vision

ODS Digital Signage is a comprehensive cloud-based platform for managing digital signage players across multiple customer organizations. The system provides role-based access control, tenant isolation, real-time player monitoring, content management, and playlist scheduling - all within a secure, scalable multi-tenant architecture.

---

## 🏗️ System Architecture

### Technology Stack

**Backend:**
- Node.js + Express.js (REST API)
- Socket.IO (Real-time player communication)
- SQLite (Local development database)
- Supabase (Production PostgreSQL + Auth + RLS)

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Shadcn/ui components

**Infrastructure:**
- DigitalOcean (Hosting)
- Supabase (Auth, Database, RLS policies)
- JWT-based authentication with custom claims

### Core Systems

1. **Authentication & Multi-Tenancy** ([Phase 5](#phase-5-authentication--multi-tenancy))
   - JWT authentication with Supabase
   - Custom claims (`organization_id`, `role`, `view_as`)
   - 6 roles: Owner, Manager, Viewer, Integrations, ODSAdmin, ODSTech
   - Tenant isolation across all API routes
   - "View As" functionality for ODS staff

2. **Player Management**
   - Real-time player status monitoring
   - Player groups for bulk operations
   - Remote control capabilities
   - Analytics and uptime tracking

3. **Content Management**
   - Image and video uploads with thumbnails
   - URL-based content (web pages, streams)
   - Folder organization
   - Content library with search/filter

4. **Playlist System**
   - Drag-and-drop playlist builder
   - Playlist templates for common use cases
   - Asset directory for quick content selection
   - Scheduled playlist deployment

5. **Audit Trail**
   - Comprehensive logging of all user actions
   - Special tracking for "View As" impersonation
   - Compliance reporting capabilities

---

## 👥 User Roles & Permissions

### Customer Roles

**Owner** (Full Control)
- Create, edit, delete all resources
- Manage team members
- Access all features
- View analytics

**Manager** (Edit Access)
- Create and edit resources
- Cannot delete resources
- Cannot manage team members
- View analytics

**Viewer** (Read-Only)
- View all resources
- Cannot create, edit, or delete
- View analytics

**Integrations** (API-Only)
- API key-based access
- Programmatic resource management
- No dashboard access (redirects to API settings)

### ODS Staff Roles

**ODSAdmin** (Super Admin)
- Access to ALL organizations
- Can switch to "View As" mode (Tech or Customer)
- Full system administration
- Audit trail access

**ODSTech** (Support Technician)
- Access to assigned organizations only
- Can switch between assigned orgs
- Support and troubleshooting capabilities
- Limited to technical operations

---

## 📊 Database Schema

### Multi-Tenancy Fields

All tenant-scoped tables include:
- `org_id` or `organization_id` - Links to organizations table
- Enforced via backend API filtering (not RLS)

### Core Tables

**Organizations**
- `id`, `name`, `created_at`, `updated_at`
- Managed in Supabase with RLS policies

**Users** (Supabase Auth)
- `id`, `email`, `raw_user_meta_data`
- Metadata includes: `organization_id`, `role`, `view_as`

**Players**
- `id`, `name`, `cpu_serial`, `org_id`, `group_id`, `status`
- Real-time status tracking
- Unique `cpu_serial` per organization

**Content**
- `id`, `name`, `type`, `url`, `duration`, `org_id`, `metadata`
- Supports images, videos, URLs
- Thumbnail generation for media

**Playlists**
- `id`, `name`, `description`, `org_id`, `created_by`
- Junction tables: `playlist_content`, `playlist_assets`

**Player Groups**
- `id`, `name`, `description`, `location`, `organization_id`
- For bulk player management

**Playlist Templates**
- `id`, `name`, `description`, `content_items`, `organization_id`
- Reusable playlist configurations

**Audit Logs** (Supabase)
- `id`, `user_id`, `action`, `resource_type`, `resource_id`, `metadata`
- Tracks all mutations and "View As" actions

**Tech Assignments** (Supabase)
- `id`, `tech_id`, `organization_id`
- Maps ODSTech users to customer organizations

---

## 🔒 Security Model

### Tenant Isolation

**Backend API Filtering:**
- All routes filter by `req.user.effective_organization_id`
- ODSAdmin can see all orgs when NOT in "View As" mode
- Auto-inject `org_id` on resource creation
- Verify ownership on update/delete operations

**Supabase RLS Policies:**
- 15 policies across organizations, users, tech_assignments, audit_logs
- Enforces tenant boundaries at database level
- Complements backend API filtering

### Role-Based Access Control (RBAC)

**Middleware Functions:**
- `authMiddleware` - JWT verification, user context injection
- `requireRole(...roles)` - Enforce specific roles
- `requireODSStaff` - ODS staff only
- `requireCustomer` - Customer roles only
- `requireWriteAccess` - Owner or Manager only
- `requireOwner` - Owner only

**Applied to Routes:**
- GET routes: Tenant filtering
- POST routes: `requireWriteAccess` + auto-inject org_id
- PATCH routes: `requireWriteAccess` + verify ownership
- DELETE routes: `requireOwner` + verify ownership

### "View As" Functionality

**Purpose:** Allow ODS staff to impersonate customer organizations for support

**Features:**
- ODSAdmin can view as any organization
- ODSTech can only view assigned organizations
- All actions logged to audit_logs
- JWT updated with `view_as` claim
- `effective_organization_id` respects View As context

**API Endpoints:**
- `POST /api/view-as/switch` - Enter View As mode
- `POST /api/view-as/exit` - Exit View As mode
- `GET /api/view-as/current` - Get current View As state
- `GET /api/view-as/available` - List available orgs

---

## 📁 Project Structure

```
ods-signage/
├── server/                    # Backend API
│   ├── middleware/
│   │   └── auth.js           # Auth middleware + RBAC
│   ├── routes/
│   │   ├── players.js        # Players API (tenant-filtered)
│   │   ├── playlists.js      # Playlists API (tenant-filtered)
│   │   ├── content.js        # Content API (tenant-filtered)
│   │   ├── folders.js        # Folders API (tenant-filtered)
│   │   ├── player-groups.js  # Player Groups API (tenant-filtered)
│   │   ├── playlist-templates.js  # Templates API (tenant-filtered)
│   │   └── view-as.js        # View As API (ODS staff only)
│   ├── migrations/
│   │   ├── supabase-custom-claims-hook.sql
│   │   ├── SUPABASE_CUSTOM_CLAIMS_GUIDE.md
│   │   └── beta-state-push-supabase.sql
│   ├── database.js           # SQLite connection
│   └── index.js              # Express server + Socket.IO
│
├── dashboard/                # Frontend (Next.js)
│   ├── app/
│   │   ├── login/           # Login page
│   │   ├── dashboard/       # Main dashboard
│   │   ├── players/         # Players management
│   │   ├── playlists/       # Playlists management
│   │   ├── content/         # Content library
│   │   └── settings/        # User settings
│   ├── components/
│   │   ├── AuthProvider.tsx # Auth context provider
│   │   └── RoleGate.tsx     # Role-based UI rendering
│   └── lib/
│       ├── auth.ts          # Auth utilities
│       └── supabase.ts      # Supabase client
│
└── kbase/                    # Knowledge Base (this directory)
    ├── artifacts/
    │   ├── current/         # Latest documentation
    │   │   ├── auth/        # Auth system docs
    │   │   ├── database/    # Database docs
    │   │   ├── api/         # API docs
    │   │   ├── frontend/    # Frontend docs
    │   │   └── deployment/  # Deployment docs
    │   └── archive/         # Historical artifacts
    ├── docs/
    │   ├── reference/       # Technical reference
    │   ├── guides/          # How-to guides
    │   └── milestones/      # Project milestones
    └── kbase_index.md       # Master navigation (this file)
```

---

## 🚀 Development Phases

### Phase 1: Database & Auth Foundation ✅
- SQLite schema with org_id fields
- Supabase migration with RLS policies
- Initial auth setup

### Phase 2: Player Groups & Templates ✅
- Player groups sidebar
- Playlist templates sidebar
- Backend APIs for groups and templates

### Phase 3: Audit Trail & API Keys ✅
- Audit logging middleware
- Operations page enhancements
- API key management
- Tech assignment system

### Phase 4: Analytics & Polish ✅
- Player analytics
- Geographic mapping
- UI polish and consistency

### Phase 5: Authentication & Multi-Tenancy ✅ (CURRENT)
- **Auth middleware with RBAC** ✅
- **View As functionality** ✅
- **Tenant filtering for all routes** ✅
- **Supabase custom claims hook** ✅
- **Frontend AuthProvider integration** ✅
- **End-to-end testing** (In Progress)

---

## 📚 Key Documentation

### Current (Latest)

**Authentication System:**
- [Phase 5 Tenant Filtering Walkthrough](./artifacts/current/auth/phase5_tenant_filtering_walkthrough.md)
- [Phase 5 Auth Plan](./artifacts/current/auth/phase5_auth_plan.md)
- [Supabase Quick Start](./artifacts/current/auth/supabase_quick_start.md)

**Project Management:**
- [Task Master List](./artifacts/current/task.md)

**Deployment:**
- [Supabase Custom Claims Guide](../server/migrations/SUPABASE_CUSTOM_CLAIMS_GUIDE.md)
- [Supabase Migration Instructions](../server/migrations/SUPABASE_MIGRATION_INSTRUCTIONS.md)

### Archive (Historical)

All phase walkthroughs and plans are archived in `./artifacts/archive/` for historical reference.

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=3001
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Supabase Setup

1. **Custom Claims Hook** (Required for auth)
   - Create function via SQL Editor
   - Enable hook in Auth → Hooks
   - See: [SUPABASE_CUSTOM_CLAIMS_GUIDE.md](../server/migrations/SUPABASE_CUSTOM_CLAIMS_GUIDE.md)

2. **RLS Policies** (15 policies)
   - Organizations (4 policies)
   - Users (4 policies)
   - Tech Assignments (3 policies)
   - Audit Logs (4 policies)

3. **User Metadata Structure:**
   ```json
   {
     "organization_id": "org-uuid",
     "role": "Owner|Manager|Viewer|Integrations|ODSAdmin|ODSTech",
     "view_as": {
       "mode": "tech|customer",
       "organization_id": "org-uuid",
       "original_role": "ODSAdmin"
     }
   }
   ```

---

## 🧪 Testing

### Manual Testing Checklist

**Owner Role:**
- [ ] Can see only own org's resources
- [ ] Can create, edit, delete resources
- [ ] Cannot see other orgs' data

**Manager Role:**
- [ ] Can create and edit resources
- [ ] Cannot delete resources
- [ ] Cannot see other orgs' data

**Viewer Role:**
- [ ] Can view resources (read-only)
- [ ] Cannot create, edit, or delete
- [ ] Cannot see other orgs' data

**ODSAdmin Role:**
- [ ] Can see ALL organizations
- [ ] Can switch to "View As Tech" mode
- [ ] Can switch to "View As Customer" mode
- [ ] View As actions logged to audit_logs

**ODSTech Role:**
- [ ] Can see only assigned organizations
- [ ] Can switch between assigned orgs
- [ ] Cannot see unassigned orgs

### API Testing

```bash
# Get JWT from browser
TOKEN="your-jwt-here"

# Test tenant isolation
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/players

# Test View As switching
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"customer","organization_id":"org-123"}' \
  http://localhost:3001/api/view-as/switch
```

---

## 🎯 Success Criteria

- [x] All 6 roles functional with correct page access
- [x] "View As" tenant switcher works for ODSAdmin/ODSTech
- [x] Supabase RLS enforces tenant isolation
- [x] Auth middleware enforces RBAC
- [x] All API routes have tenant filtering
- [ ] Audit trail captures all user actions
- [ ] End-to-end auth flow tested
- [ ] Zero data leaks between organizations

---

## 📊 Statistics

**Total Routes with Tenant Filtering:** 6
- Players API
- Playlists API
- Player Groups API
- Content API
- Folders API
- Playlist Templates API

**Total RBAC Middleware Functions:** 8
- authMiddleware
- requireRole
- requireODSStaff
- requireCustomer
- requireWriteAccess
- requireOwner
- hasOrgAccess
- verifyOrgAccess

**Total Supabase RLS Policies:** 15
- Organizations: 4
- Users: 4
- Tech Assignments: 3
- Audit Logs: 4

**Total User Roles:** 6
- Owner, Manager, Viewer (Customer)
- Integrations (API-only)
- ODSAdmin, ODSTech (ODS Staff)

---

## 🔄 Maintenance

### Adding New Features

1. **Backend API Route:**
   - Add tenant filtering (filter by `effective_organization_id`)
   - Auto-inject `org_id` on create
   - Verify ownership on update/delete
   - Apply RBAC middleware

2. **Frontend Component:**
   - Use `authenticatedFetch` for API calls
   - Wrap with `RoleGate` for role-based rendering
   - Use `useAuth` hook for user context

3. **Documentation:**
   - Update this overview
   - Create walkthrough in `kbase/artifacts/current/`
   - Update `kbase_index.md`

### Deployment

1. **Backend:**
   - Build: `npm run build` (if applicable)
   - Deploy to DigitalOcean
   - Update environment variables

2. **Frontend:**
   - Build: `npm run build`
   - Deploy to DigitalOcean or Vercel
   - Update environment variables

3. **Database:**
   - Run migrations in Supabase SQL Editor
   - Verify RLS policies
   - Test custom claims hook

---

## 📞 Support & Resources

**Documentation:**
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com/)

**Internal Resources:**
- [Task Master List](./artifacts/current/task.md)
- [Supabase Custom Claims Guide](../server/migrations/SUPABASE_CUSTOM_CLAIMS_GUIDE.md)
- [Phase 5 Walkthrough](./artifacts/current/auth/phase5_tenant_filtering_walkthrough.md)

---

**Last Updated:** February 11, 2026  
**Created By:** Antigravity (Google Deepmind)  
**Purpose:** Comprehensive project overview and technical reference  
**Status:** Phase 5 (Auth & Multi-Tenancy) - 95% Complete
