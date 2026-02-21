# Kbase Index - ODS Digital Signage Platform

**Master navigation for ODS Digital Signage knowledge base**  
**Format:** Thing : Description : Location  
**Last Updated:** February 19, 2026

---

## 📁 Quick Navigation

### By Purpose
- **Project Overview** → `/kbase/PROJECT_OVERVIEW.md`
- **Current Auth Docs** → `/kbase/artifacts/current/auth/`
- **Task Master List** → `/kbase/artifacts/current/task.md`
- **Deployment Guides** → `/server/migrations/`
- **Complete Archive** → `/kbase/artifacts/archive/`
- **Recollection (Sprint State)** → `/kbase/recollection.md`

### By System
- **Authentication** → `/kbase/artifacts/current/auth/`
- **Database** → `/kbase/artifacts/current/database/`
- **API Routes** → `/kbase/artifacts/current/api/`
- **Frontend** → `/kbase/artifacts/current/frontend/`
- **Deployment** → `/kbase/artifacts/current/deployment/`
- **Player OS** → `../ods-player-os-atlas/.arch/`
- **Architecture Overview** → `/.arch/project.md`

---

## 🏗️ Current Production Documentation

### Authentication & Multi-Tenancy
- phase5_tenant_filtering_walkthrough.md : Complete tenant filtering implementation : `/kbase/artifacts/current/auth/`
- phase5_auth_plan.md : Phase 5 implementation plan : `/kbase/artifacts/current/auth/`
- supabase_quick_start.md : Quick start guide for Supabase setup : `/kbase/artifacts/current/auth/`

### Project Management
- task.md : Master task list for all phases : `/kbase/artifacts/current/`

### Deployment
- SUPABASE_CUSTOM_CLAIMS_GUIDE.md : Comprehensive Supabase hook guide : `/server/migrations/`
- supabase-custom-claims-hook.sql : Custom claims SQL function : `/server/migrations/`
- SUPABASE_MIGRATION_INSTRUCTIONS.md : Migration instructions : `/server/migrations/`
- beta-state-push-supabase.sql : Beta state migration : `/server/migrations/`

---

## 📚 Core Documentation

### Architecture
- PROJECT_OVERVIEW.md : Complete system architecture & overview : `/kbase/`
  - Technology stack
  - User roles & permissions
  - Database schema
  - Security model
  - Project structure
  - Development phases

### Backend Code
- server/middleware/auth.js : Auth middleware + RBAC functions : `/server/middleware/`
- server/routes/view-as.js : View As API for ODS staff : `/server/routes/`
- server/routes/players.js : Players API (tenant-filtered) : `/server/routes/`
- server/routes/playlists.js : Playlists API (tenant-filtered) : `/server/routes/`
- server/routes/player-groups.js : Player Groups API (tenant-filtered) : `/server/routes/`
- server/routes/content.js : Content API (tenant-filtered) : `/server/routes/`
- server/routes/folders.js : Folders API (tenant-filtered) : `/server/routes/`
- server/routes/playlist-templates.js : Templates API (tenant-filtered) : `/server/routes/`

### Frontend Code
- dashboard/lib/auth.ts : Auth utilities (authenticatedFetch, etc.) : `/dashboard/lib/`
- dashboard/components/AuthProvider.tsx : Auth context provider : `/dashboard/components/`
- dashboard/components/RoleGate.tsx : Role-based UI rendering : `/dashboard/components/`

---

## 📦 Complete Archive

**Location:** `/kbase/artifacts/archive/`

**Contains:**
- All phase walkthroughs (phase1-5)
- All phase implementation plans
- Historical documentation
- Evolution tracking

**Purpose:** Historical reference, evolution tracking, complete context for future iterations

---

## 🎯 Key Features

### Multi-Tenancy
- **Tenant Isolation** : All routes filter by org_id : Backend API + Supabase RLS
- **Auto-Injection** : org_id auto-injected on create : All POST routes
- **Ownership Verification** : Verify ownership on update/delete : All PATCH/DELETE routes
- **ODSAdmin Override** : Can see all orgs when not in View As : All GET routes

### Role-Based Access Control (RBAC)
- **6 Roles** : Owner, Manager, Viewer, Integrations, ODSAdmin, ODSTech : User metadata
- **8 Middleware Functions** : authMiddleware, requireRole, requireWriteAccess, etc. : `/server/middleware/auth.js`
- **Applied to All Routes** : GET/POST/PATCH/DELETE protection : All API routes

### View As Functionality
- **ODS Staff Impersonation** : View as customer or tech : `/server/routes/view-as.js`
- **Audit Logging** : All View As actions logged : Supabase audit_logs table
- **JWT Claims** : view_as claim in JWT : Custom access token hook

### Supabase Integration
- **Custom Claims Hook** : Injects org_id, role, view_as into JWT : `/server/migrations/supabase-custom-claims-hook.sql`
- **RLS Policies** : 15 policies across 4 tables : Supabase Dashboard
- **Auth Provider** : Supabase Auth integration : `/dashboard/components/AuthProvider.tsx`

---

## 🔗 Cross-References

### Authentication System
- Auth Middleware : RBAC enforcement : `/server/middleware/auth.js`
- View As API : ODS staff impersonation : `/server/routes/view-as.js`
- Auth Utilities : Frontend auth helpers : `/dashboard/lib/auth.ts`
- Auth Provider : React context : `/dashboard/components/AuthProvider.tsx`
- Custom Claims Hook : JWT claims injection : `/server/migrations/supabase-custom-claims-hook.sql`

### Tenant-Filtered Routes
- Players API : org_id filtering : `/server/routes/players.js`
- Playlists API : org_id filtering : `/server/routes/playlists.js`
- Player Groups API : organization_id filtering : `/server/routes/player-groups.js`
- Content API : org_id filtering : `/server/routes/content.js`
- Folders API : org_id filtering : `/server/routes/folders.js`
- Playlist Templates API : organization_id filtering : `/server/routes/playlist-templates.js`

### Documentation
- Project Overview : Complete system architecture : `/kbase/PROJECT_OVERVIEW.md`
- Phase 5 Walkthrough : Tenant filtering implementation : `/kbase/artifacts/current/auth/phase5_tenant_filtering_walkthrough.md`
- Supabase Guide : Custom claims setup : `/server/migrations/SUPABASE_CUSTOM_CLAIMS_GUIDE.md`
- Quick Start : 5-minute setup : `/kbase/artifacts/current/auth/supabase_quick_start.md`

### Player OS (ods-player-os-atlas)
- Architecture Overview : System layers, build pipeline, v5 state : `../ods-player-os-atlas/.arch/project.md`
- Boot UX Pipeline : Flash-free boot sequence, VT lockdown : `../ods-player-os-atlas/.arch/boot_ux_pipeline.md`
- Build Guide : Golden image build steps + gotchas : `../ods-player-os-atlas/.arch/build_guide.md`
- Player OS README : Comprehensive feature/API reference : `../ods-player-os-atlas/README.md`
- Integration : Dashboard ↔ Player data flow : `/.arch/player_os_integration.md`

---

## 🎯 Common Tasks

### Find Latest Documentation
1. Navigate to `/kbase/PROJECT_OVERVIEW.md` for system overview
2. Check `/kbase/artifacts/current/[system]/` for system-specific docs
3. Check `/server/migrations/` for deployment guides

### Find Code Implementation
1. Backend routes: `/server/routes/`
2. Auth middleware: `/server/middleware/auth.js`
3. Frontend components: `/dashboard/components/`
4. Frontend utilities: `/dashboard/lib/`

### Deploy Supabase Hook
1. Read `/server/migrations/SUPABASE_CUSTOM_CLAIMS_GUIDE.md`
2. Or use quick start: `/kbase/artifacts/current/auth/supabase_quick_start.md`
3. Execute SQL from `/server/migrations/supabase-custom-claims-hook.sql`

### Test Tenant Isolation
1. Follow testing checklist in `/kbase/PROJECT_OVERVIEW.md`
2. Review walkthrough: `/kbase/artifacts/current/auth/phase5_tenant_filtering_walkthrough.md`
3. Check audit logs in Supabase

### Add New Feature
1. Review architecture in `/kbase/PROJECT_OVERVIEW.md`
2. Follow tenant filtering patterns from existing routes
3. Apply RBAC middleware from `/server/middleware/auth.js`
4. Update documentation in `/kbase/`

---

## 📊 Statistics

**Total Documentation Files:** 15+
- Current artifacts: 4 files
- Archive artifacts: 10+ files
- Deployment guides: 3 files
- Project overview: 1 file

**Total Code Files with Tenant Filtering:** 6
- Players, Playlists, Player Groups, Content, Folders, Playlist Templates

**Total RBAC Middleware Functions:** 8
- authMiddleware, requireRole, requireODSStaff, requireCustomer, requireWriteAccess, requireOwner, hasOrgAccess, verifyOrgAccess

**Total Supabase RLS Policies:** 15
- Organizations (4), Users (4), Tech Assignments (3), Audit Logs (4)

**Total User Roles:** 6
- Owner, Manager, Viewer, Integrations, ODSAdmin, ODSTech

**Development Phases Completed:** 5
- Phase 1: Database & Auth Foundation
- Phase 2: Player Groups & Templates
- Phase 3: Audit Trail & API Keys
- Phase 4: Analytics & Polish
- Phase 5: Authentication & Multi-Tenancy (95% complete)

---

## 🔄 Maintenance

### Adding New Documentation
1. Create file in `/kbase/artifacts/current/[system]/`
2. Add entry to this index under appropriate section
3. Update cross-references if needed
4. Archive old versions to `/kbase/artifacts/archive/`

### Updating Existing Documentation
1. Edit file in `/kbase/artifacts/current/`
2. Move old version to `/kbase/artifacts/archive/`
3. Update this index with new information
4. Update cross-references if changed

### Archiving Old Versions
1. Copy to `/kbase/artifacts/archive/` with date
2. Keep latest in `/kbase/artifacts/current/`
3. Update this index to reflect archive location

---

## 🚀 Next Steps

### Immediate (Phase 5 Completion)
- [ ] Test end-to-end auth flow with all roles
- [ ] Verify tenant isolation (no data leaks)
- [ ] Test View As functionality
- [ ] Verify audit logging

### Future Phases
- [ ] Phase 6: Production deployment
- [ ] Phase 7: Advanced analytics
- [ ] Phase 8: Mobile app
- [ ] Phase 9: Advanced scheduling

---

**Last Updated:** February 19, 2026, 3:35 PM PST  
**Created By:** Antigravity (Google Deepmind)  
**Purpose:** Master navigation for ODS Digital Signage knowledge base  
**Files Indexed:** 20+ documentation files, 6 tenant-filtered routes, 8 RBAC functions  
**Status:** Phase 5 Complete · Player OS v5 Golden Image Built
