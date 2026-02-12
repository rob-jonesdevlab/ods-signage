# Beta State Push - Phase 4 Implementation Tasks

## Phase 1: Database & Auth Foundation (Week 1)

### Database Schema
- [x] Create migration script `migrate-beta-state-push.js`
- [x] Add `player_groups` table (SQLite)
- [x] Add `playlist_templates` table (SQLite)
- [x] Add `player_analytics` table (SQLite)
- [x] Modify `players` table (add org_id, group_id) - SQLite
- [x] Modify `content` table (add org_id) - SQLite
- [x] Modify `playlists` table (add org_id) - SQLite
- [x] Create Supabase migration script
- [x] Run Supabase migration (organizations, users, tech_assignments, audit_logs)
- [x] Verify RLS policies (15 policies confirmed)
- [ ] Create seed data script `seed-beta-data.js`
- [ ] Test tenant isolation with seed data

### Supabase RLS Policies
- [x] Set up Supabase RLS policies for `organizations` table (4 policies)
- [x] Set up Supabase RLS policies for `players` table (will be in backend API)
- [x] Set up Supabase RLS policies for `playlists` table (will be in backend API)
- [x] Set up Supabase RLS policies for `content` table (will be in backend API)
- [x] Set up Supabase RLS policies for `player_groups` table (will be in backend API)
- [x] Set up Supabase RLS policies for `playlist_templates` table (will be in backend API)
- [x] Set up Supabase RLS policies for `audit_logs` table (4 policies)
- [x] Set up Supabase RLS policies for `users` table (4 policies)
- [x] Set up Supabase RLS policies for `tech_assignments` table (3 policies)
- [ ] Test tenant isolation (verify no data leaks)
- [ ] Test ODSAdmin access (all orgs)
- [ ] Test ODSTech access (assigned orgs only)

### Authentication & JWT
- [x] Create auth middleware for role-based access (`server/middleware/auth.js`)
- [x] Implement "View As" functionality (`server/routes/view-as.js`)
- [x] Add tenant filtering to all API routes (players, playlists, player-groups, content, folders, playlist-templates)
- [x] Enforce RBAC with requireWriteAccess and requireOwner middleware
- [ ] Configure Supabase custom claims hook (add `organization_id` and `role` to JWT)
- [ ] Wrap dashboard app with AuthProvider
- [ ] Test role-based page access restrictions
- [ ] Test end-to-end auth flow with JWT claims

---

## Phase 2: Player Groups & Templates (Week 1-2)

### Player Groups Sidebar
- [x] Create `PlayerGroupSidebar.tsx` component
- [x] Implement group list with player counts
- [x] Add "New Group" button and modal
- [x] Create `CreateGroupModal.tsx` component
- [x] Implement drag-and-drop player assignment
- [x] Create `GroupContextMenu.tsx` component
- [x] Add "Deploy Playlist to Group" functionality

- [ ] Create `DeployToGroupModal.tsx` component
- [ ] Integrate sidebar into Players page
- [ ] Test group filtering
- [ ] Test drag-and-drop assignment

### Playlist Templates Sidebar
- [ ] Create `PlaylistTemplateSidebar.tsx` component
- [ ] Implement template categories (Retail, Restaurant, Corporate, Custom)
- [ ] Add "Create from Template" functionality
- [ ] Create `CreateFromTemplateModal.tsx` component
- [ ] Add "Save as Template" functionality
- [ ] Create `SaveAsTemplateModal.tsx` component
- [ ] Integrate sidebar into Playlists page
- [ ] Seed ODS-provided templates (is_public=true)
- [ ] Test template creation workflow
- [ ] Test template usage workflow

### Backend APIs
- [ ] Create `server/routes/player-groups.js`
- [ ] Implement GET /api/player-groups
- [ ] Implement POST /api/player-groups
- [ ] Implement PUT /api/player-groups/:id
- [ ] Implement DELETE /api/player-groups/:id
- [ ] Implement POST /api/player-groups/:id/assign-players
- [ ] Implement POST /api/player-groups/:id/deploy
- [ ] Create `server/routes/playlist-templates.js`
- [ ] Implement GET /api/playlist-templates
- [ ] Implement POST /api/playlist-templates
- [ ] Implement DELETE /api/playlist-templates/:id
- [ ] Implement POST /api/playlists/from-template/:templateId

---

## Phase 3: Audit Trail, API Keys & Tech Management (Week 2)

### Audit Logging
- [ ] Create `server/middleware/audit.js`
- [ ] Implement automatic audit logging for all mutations
- [ ] Apply audit middleware to all API routes
- [ ] Test audit log capture

### Operations Page Enhancement
- [ ] Remove "Deployment Center" section
- [ ] Expand "Recent Activity" section vertically
- [ ] Add "View All" button to Recent Activity
- [ ] Create `AuditTrailModal.tsx` component
- [ ] Implement audit log filtering (user, action, resource, date)
- [ ] Add pagination to audit log table
- [ ] Implement CSV export functionality
- [ ] Implement PDF export functionality
- [ ] Add "Generate Compliance Report" feature
- [ ] Test audit trail modal

### API Keys Management
- [ ] Add "API Access" tab to User Settings
- [ ] Create API keys table UI
- [ ] Implement API key creation
- [ ] Implement API key revocation
- [ ] Add API usage statistics chart
- [ ] Create backend API for key management
- [ ] Test API key authentication

### Integrations Role
- [ ] Implement Integrations role login redirect to `/settings/api`
- [ ] Hide non-API tabs for Integrations role
- [ ] Make Profile tab read-only for Integrations role
- [ ] Allow Security tab (password change only) for Integrations role
- [ ] Add "API Access Only" badge in header
- [ ] Test Integrations role access restrictions

### Tech Management (ODSAdmin)
- [ ] Add "Team Members" tab to User Settings (ODSAdmin only)
- [ ] Create ODS Staff table UI
- [ ] Create `ManageTechAssignmentsModal.tsx` component
- [ ] Implement assign org to tech functionality
- [ ] Implement unassign org from tech functionality
- [ ] Create `InviteODSStaffModal.tsx` component
- [ ] Create `server/routes/tech-management.js`
- [ ] Implement GET /api/tech-management/techs
- [ ] Implement POST /api/tech-management/techs/:id/assign
- [ ] Implement DELETE /api/tech-management/techs/:id/unassign/:orgId
- [ ] Implement GET /api/tech-management/techs/:id/assignments
- [ ] Implement POST /api/tech-management/invite
- [ ] Test tech assignment workflow

### Mode Switching UI
- [ ] Implement ODSAdmin 3-mode selector (Administrator, View As Tech, View As Customer)
- [ ] Implement context-aware dropdowns for each mode
- [ ] Implement ODSTech "Technician Mode" badge
- [ ] Implement assigned org dropdown for ODSTech
- [ ] Add "Viewing as" badge when impersonating
- [ ] Test mode switching and JWT claim updates
- [ ] Test "View As Tech" functionality
- [ ] Test "View As Customer" functionality

---

## Phase 4: Analytics & Polish (Week 2-3)

### Player Analytics
- [ ] Create `PlayerUptimeChart.tsx` component
- [ ] Create `OfflineIncidentsTimeline.tsx` component
- [ ] Create `GeographicMap.tsx` component (Leaflet.js)
- [ ] Add Player Analytics section to Analytics page
- [ ] Implement player uptime data collection
- [ ] Implement offline incident tracking
- [ ] Create `server/routes/analytics.js`
- [ ] Implement GET /api/analytics/players
- [ ] Implement GET /api/analytics/players/:id
- [ ] Implement GET /api/analytics/offline-incidents
- [ ] Implement GET /api/analytics/geographic
- [ ] Test analytics data visualization

### Remote Desktop (Optional)
- [ ] Add "Remote Desktop" button to Players page
- [ ] Implement RustDesk connection info API
- [ ] Create `server/routes/remote.js`
- [ ] Implement GET /api/remote/players/:id/rustdesk
- [ ] Test RustDesk web client integration
- [ ] Evaluate usefulness and decide to keep or remove

### Organizations API
- [ ] Create `server/routes/organizations.js`
- [ ] Implement GET /api/organizations/:id
- [ ] Implement PUT /api/organizations/:id
- [ ] Implement GET /api/organizations/:id/usage
- [ ] Implement GET /api/organizations (ODSAdmin/ODSTech only)
- [ ] Test organization management

### UI Polish
- [ ] Ensure consistent sidebar styling across Pages, Playlists, Content
- [ ] Add loading states to all new components
- [ ] Add error handling to all new components
- [ ] Implement toast notifications for success/error
- [ ] Test responsive design on mobile/tablet
- [ ] Fix any TypeScript errors
- [ ] Run linter and fix issues

---

## Phase 5: Testing & Demo Prep (Week 3)

### End-to-End Testing
- [ ] Test Owner role access and permissions
- [ ] Test Manager role access and permissions
- [ ] Test Viewer role access and permissions
- [ ] Test Integrations role access and permissions
- [ ] Test ODSAdmin Administrator mode
- [ ] Test ODSAdmin "View As Tech" mode
- [ ] Test ODSAdmin "View As Customer" mode
- [ ] Test ODSTech Technician mode
- [ ] Test tenant isolation (no data leaks between orgs)
- [ ] Test tech assignment enforcement
- [ ] Test player group workflows
- [ ] Test playlist template workflows
- [ ] Test audit trail capture and export
- [ ] Test API key creation and usage

### Data Seeding
- [ ] Create demo organizations (3-5 orgs)
- [ ] Create demo users for each role
- [ ] Create demo ODSTech users with assignments
- [ ] Create demo player groups
- [ ] Create demo playlist templates
- [ ] Seed audit log data
- [ ] Seed analytics data

### Documentation
- [ ] Create demo script (15-minute walkthrough)
- [ ] Document role permissions matrix
- [ ] Document API endpoints
- [ ] Create admin guide for tech assignment
- [ ] Create user guide for player groups
- [ ] Create user guide for playlist templates

### Deployment
- [ ] Run production build (`npm run build`)
- [ ] Fix any build errors
- [ ] Test production build locally
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor for errors

### Demo Preparation
- [ ] Rehearse demo script
- [ ] Prepare demo data
- [ ] Create demo video/screenshots
- [ ] Prepare FAQ for common questions
- [ ] Final walkthrough document

---

## Success Criteria

- [ ] All 6 roles functional with correct page access
- [ ] "View As" tenant switcher works for ODSAdmin/ODSTech
- [ ] Supabase RLS enforces tenant isolation (no data leaks)
- [ ] Player groups sidebar matches Content Library UX
- [ ] Playlist templates sidebar matches Content Library UX
- [ ] Audit trail captures all user actions
- [ ] API keys can be created, used, and revoked
- [ ] Analytics dashboard shows player uptime
- [ ] Demo can be completed in 15 minutes
- [ ] Zero TypeScript errors in build
- [ ] Zero console errors in browser
- [ ] All pages responsive on mobile/tablet
