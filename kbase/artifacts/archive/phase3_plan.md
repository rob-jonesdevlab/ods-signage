# Phase 3: Playlist Templates & Audit Trail - Implementation Plan

**Goal:** Add Playlist Templates sidebar to Playlists page and enhance Audit Trail in Operations page, following established UX patterns from Content Library and Player Groups.

**Timeline:** 1-2 days  
**Status:** Ready to implement

---

## User Review Required

> [!IMPORTANT]
> **Scope Confirmation**
> This phase leverages existing patterns and infrastructure:
> - ✅ Sidebar pattern from Content Library and Player Groups
> - ✅ Drag-and-drop from Content Library
> - ✅ Supabase RLS for authorization
> - ✅ Existing audit_logs table from Phase 1
> - ✅ Existing User Settings page structure
> 
> **No Breaking Changes** - All features are additive

---

## Proposed Changes

### 1. Playlist Templates

#### Database Schema (Already exists from Phase 1)
```sql
-- SQLite table (already created in beta-state-push-sqlite.js)
CREATE TABLE playlist_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    organization_id TEXT,
    content_items TEXT, -- JSON array of content IDs
    duration_per_item INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Backend API Routes

##### [NEW] `server/routes/playlist-templates.js`
```javascript
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

// List all templates
router.get('/', (req, res) => {
    const templates = db.prepare(`
        SELECT id, name, description, organization_id, 
               content_items, duration_per_item,
               created_at, updated_at
        FROM playlist_templates
        ORDER BY name ASC
    `).all();
    
    res.json(templates.map(t => ({
        ...t,
        content_items: JSON.parse(t.content_items || '[]')
    })));
});

// Create template
router.post('/', (req, res) => {
    const { name, description, content_items, duration_per_item } = req.body;
    const id = uuidv4();
    
    db.prepare(`
        INSERT INTO playlist_templates 
        (id, name, description, content_items, duration_per_item)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, name, description, JSON.stringify(content_items || []), duration_per_item || 10);
    
    res.json({ id, name, description, content_items, duration_per_item });
});

// Update template
router.put('/:id', (req, res) => {
    const { name, description, content_items, duration_per_item } = req.body;
    
    db.prepare(`
        UPDATE playlist_templates 
        SET name = ?, description = ?, content_items = ?, 
            duration_per_item = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(name, description, JSON.stringify(content_items || []), duration_per_item, req.params.id);
    
    res.json({ success: true });
});

// Delete template
router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM playlist_templates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Create playlist from template
router.post('/:id/create-playlist', (req, res) => {
    const { name } = req.body;
    const template = db.prepare('SELECT * FROM playlist_templates WHERE id = ?').get(req.params.id);
    
    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }
    
    const playlistId = uuidv4();
    const contentItems = JSON.parse(template.content_items || '[]');
    
    db.prepare(`
        INSERT INTO playlists (id, name, content_items, duration_per_item)
        VALUES (?, ?, ?, ?)
    `).run(playlistId, name, template.content_items, template.duration_per_item);
    
    res.json({ id: playlistId, name, content_items, duration_per_item: template.duration_per_item });
});

module.exports = router;
```

##### [MODIFY] `server/index.js`
Add route registration:
```javascript
const playlistTemplatesRouter = require('./routes/playlist-templates');
app.use('/api/playlist-templates', playlistTemplatesRouter);
```

---

#### Frontend Components

##### [NEW] `dashboard/components/PlaylistTemplateTree.tsx`
Sidebar component for template navigation (mirrors `PlayerGroupTree.tsx`):
```typescript
interface PlaylistTemplate {
    id: string;
    name: string;
    description: string;
    content_items: string[];
    duration_per_item: number;
}

export default function PlaylistTemplateTree({
    templates,
    selectedTemplateId,
    onSelectTemplate,
    onContextMenu
}: {
    templates: PlaylistTemplate[];
    selectedTemplateId: string | null;
    onSelectTemplate: (id: string | null) => void;
    onContextMenu: (templateId: string, event: React.MouseEvent) => void;
}) {
    // Similar structure to PlayerGroupTree
    // Shows list of templates with content count badges
    // Right-click for context menu
}
```

##### [NEW] `dashboard/components/NewTemplateModal.tsx`
Modal for creating new templates:
```typescript
export default function NewTemplateModal({
    isOpen,
    onClose,
    onSubmit
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, description: string, durationPerItem: number) => void;
}) {
    // Form with name, description, duration per item
    // Similar to NewGroupModal
}
```

##### [NEW] `dashboard/components/TemplateContextMenu.tsx`
Context menu for template actions:
```typescript
export default function TemplateContextMenu({
    templateId,
    position,
    onClose,
    onCreatePlaylist,
    onRename,
    onDelete
}: {
    templateId: string;
    position: { x: number; y: number };
    onClose: () => void;
    onCreatePlaylist: () => void;
    onRename: () => void;
    onDelete: () => void;
}) {
    // Actions: Create Playlist, Rename, Delete
    // Similar to GroupContextMenu
}
```

##### [NEW] `dashboard/components/RenameTemplateModal.tsx`
Modal for renaming templates (mirrors `RenameGroupModal.tsx`)

##### [NEW] `dashboard/components/DeleteTemplateModal.tsx`
Modal for deleting templates with confirmation (mirrors `DeleteGroupModal.tsx`)

##### [NEW] `dashboard/components/CreatePlaylistFromTemplateModal.tsx`
Modal for creating a playlist from a template:
```typescript
export default function CreatePlaylistFromTemplateModal({
    isOpen,
    template,
    onClose,
    onSubmit
}: {
    isOpen: boolean;
    template: PlaylistTemplate | null;
    onClose: () => void;
    onSubmit: (name: string) => void;
}) {
    // Shows template details
    // Input for new playlist name
    // Creates playlist with template's content items
}
```

---

#### Playlists Page Integration

##### [MODIFY] `dashboard/app/playlists/page.tsx`
Add sidebar with template tree (similar to Players page integration):
```typescript
// Add state for templates
const [templates, setTemplates] = useState<PlaylistTemplate[]>([]);
const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

// Fetch templates
useEffect(() => {
    fetch('/api/playlist-templates')
        .then(res => res.json())
        .then(setTemplates);
}, []);

// Add sidebar layout
<div className="flex gap-6">
    {/* Sidebar */}
    <aside className="w-64 flex-shrink-0">
        <PlaylistTemplateTree
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
            onContextMenu={handleTemplateContextMenu}
        />
    </aside>
    
    {/* Main content */}
    <div className="flex-1">
        {/* Existing playlists content */}
    </div>
</div>
```

---

### 2. Enhanced Audit Trail

#### Backend API Routes

##### [NEW] `server/routes/audit-logs.js`
```javascript
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// List audit logs with filtering
router.get('/', async (req, res) => {
    const { action, user_id, start_date, end_date, limit = 100 } = req.query;
    
    let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));
    
    if (action) query = query.eq('action', action);
    if (user_id) query = query.eq('user_id', user_id);
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);
    
    const { data, error } = await query;
    
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
});

module.exports = router;
```

##### [MODIFY] `server/index.js`
Add route registration:
```javascript
const auditLogsRouter = require('./routes/audit-logs');
app.use('/api/audit-logs', auditLogsRouter);
```

---

#### Frontend Components

##### [MODIFY] `dashboard/app/operations/page.tsx`
Enhance existing Operations page with Audit Trail section:
```typescript
// Add audit logs state
const [auditLogs, setAuditLogs] = useState([]);
const [auditFilters, setAuditFilters] = useState({
    action: '',
    user_id: '',
    start_date: null,
    end_date: null
});

// Fetch audit logs
useEffect(() => {
    const params = new URLSearchParams();
    if (auditFilters.action) params.append('action', auditFilters.action);
    if (auditFilters.user_id) params.append('user_id', auditFilters.user_id);
    if (auditFilters.start_date) params.append('start_date', auditFilters.start_date);
    if (auditFilters.end_date) params.append('end_date', auditFilters.end_date);
    
    fetch(`/api/audit-logs?${params}`)
        .then(res => res.json())
        .then(setAuditLogs);
}, [auditFilters]);

// Add Audit Trail section
<div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
    <div className="p-6 border-b border-slate-700/50">
        <h2 className="text-2xl font-bold text-white">Audit Trail</h2>
    </div>
    
    {/* Filters */}
    <div className="p-6 border-b border-slate-700/50 flex gap-4">
        <FilterDropdown
            label="Action"
            options={actionFilterOptions}
            value={auditFilters.action}
            onChange={(action) => setAuditFilters({ ...auditFilters, action })}
        />
        <DateRangePicker
            value={{ start: auditFilters.start_date, end: auditFilters.end_date }}
            onChange={({ start, end }) => setAuditFilters({ ...auditFilters, start_date: start, end_date: end })}
        />
    </div>
    
    {/* Audit logs table */}
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead className="bg-slate-900/50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Details</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
                {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {log.user_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                {log.action}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {log.resource_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                            {log.details}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
</div>
```

---

### 3. API Key Management (Optional - if time permits)

#### Frontend Components

##### [MODIFY] `dashboard/app/settings/api/page.tsx`
Enhance existing API settings page with key management:
- List API keys with creation date and last used
- Generate new API keys
- Revoke existing keys
- Copy key to clipboard (show once on creation)

---

## Verification Plan

### Automated Tests
```bash
# Test playlist template API
curl http://localhost:3001/api/playlist-templates

# Create template
curl -X POST http://localhost:3001/api/playlist-templates \
  -H "Content-Type: application/json" \
  -d '{"name":"Morning Loop","description":"Morning content","content_items":[],"duration_per_item":10}'

# Test audit logs API
curl http://localhost:3001/api/audit-logs?limit=10
```

### Manual Verification
1. **Playlist Templates:**
   - Navigate to https://ods-cloud.com/playlists
   - Verify sidebar shows "Templates" section
   - Click "+" to create new template
   - Verify template appears in sidebar
   - Right-click template → "Create Playlist"
   - Verify playlist created with template content

2. **Audit Trail:**
   - Navigate to https://ods-cloud.com/operations
   - Verify "Audit Trail" section visible
   - Test action filter dropdown
   - Test date range picker
   - Verify logs display correctly

3. **Integration:**
   - Create template, verify audit log created
   - Delete template, verify audit log created
   - Create playlist from template, verify audit log created

---

## File Summary

### New Files (8)
- `server/routes/playlist-templates.js` - Template CRUD API
- `server/routes/audit-logs.js` - Audit log query API
- `dashboard/components/PlaylistTemplateTree.tsx` - Sidebar component
- `dashboard/components/NewTemplateModal.tsx` - Create template modal
- `dashboard/components/TemplateContextMenu.tsx` - Template actions menu
- `dashboard/components/RenameTemplateModal.tsx` - Rename modal
- `dashboard/components/DeleteTemplateModal.tsx` - Delete confirmation
- `dashboard/components/CreatePlaylistFromTemplateModal.tsx` - Create playlist modal

### Modified Files (3)
- `server/index.js` - Register new routes
- `dashboard/app/playlists/page.tsx` - Add sidebar integration
- `dashboard/app/operations/page.tsx` - Add audit trail section

---

## Estimated Effort

**Backend:** 2-3 hours
- Playlist template API routes: 1 hour
- Audit logs API routes: 1 hour
- Testing: 30 minutes

**Frontend:** 4-5 hours
- Template sidebar components: 2 hours
- Playlists page integration: 1 hour
- Audit trail enhancement: 1.5 hours
- Testing: 30 minutes

**Total:** 6-8 hours (1 day)

---

## Success Criteria

- [ ] Playlist Templates sidebar visible on Playlists page
- [ ] Create/Rename/Delete templates working
- [ ] Create playlist from template working
- [ ] Audit Trail visible on Operations page
- [ ] Audit log filtering working
- [ ] All API endpoints responding correctly
- [ ] UX consistent with Content Library and Player Groups

---

**Ready to implement!** 🚀
