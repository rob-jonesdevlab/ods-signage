const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { requireWriteAccess, requireOwner } = require('../middleware/auth');

// GET /api/folders - List all folders (excluding system folders for non-admin users)
router.get('/', async (req, res) => {
    try {
        const db = await require('../database');
        const orgId = req.user.effective_organization_id;

        let folders;
        if (req.user.role === 'ODSAdmin' && !req.user.view_as) {
            folders = db.prepare('SELECT * FROM folders ORDER BY name ASC').all();
        } else {
            folders = db.prepare('SELECT * FROM folders WHERE org_id = ? ORDER BY name ASC').all(orgId);
        }

        res.json(folders);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/folders/tree - Get complete folder hierarchy
router.get('/tree', async (req, res) => {
    try {
        const db = await require('../database');

        // Get all folders
        const folders = db.prepare('SELECT * FROM folders ORDER BY name ASC').all();

        // Get content counts for each folder
        const contentCounts = db.prepare(`
            SELECT folder_id, COUNT(*) as count
            FROM folder_content
            GROUP BY folder_id
        `).all();

        const countMap = {};
        contentCounts.forEach(row => {
            countMap[row.folder_id] = row.count;
        });

        // Build tree structure
        const buildTree = (parentId = null) => {
            return folders
                .filter(f => f.parent_id === parentId)
                .map(folder => ({
                    ...folder,
                    itemCount: countMap[folder.id] || 0,
                    children: buildTree(folder.id)
                }));
        };

        const tree = buildTree(null);
        res.json(tree);
    } catch (error) {
        console.error('Error fetching folder tree:', error);
        res.status(500).json({ error: error.message });
    }
});


// GET /api/folders/:id - Get folder details
router.get('/:id', async (req, res) => {
    try {
        const db = await require('../database');
        const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.id);

        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        res.json(folder);
    } catch (error) {
        console.error('Error fetching folder:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/folders/:id/content - Get folder contents
router.get('/:id/content', async (req, res) => {
    try {
        const db = await require('../database');

        const content = db.prepare(`
            SELECT c.*
            FROM content c
            JOIN folder_content fc ON c.id = fc.content_id
            WHERE fc.folder_id = ?
            ORDER BY c.name ASC
        `).all(req.params.id);

        // Parse JSON fields
        const parsed = content.map(item => ({
            ...item,
            metadata: JSON.parse(item.metadata || '{}')
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Error fetching folder content:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/folders - Create new folder
router.post('/', requireWriteAccess, async (req, res) => {
    try {
        const db = await require('../database');
        const { name, parent_id } = req.body;
        const orgId = req.user.effective_organization_id;

        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO folders (id, name, parent_id, org_id, is_system, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, parent_id || null, orgId, 0, now, now);

        res.json({ id, name, parent_id, org_id: orgId, is_system: 0, created_at: now, updated_at: now });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/folders/:id/content - Add content to folder
router.post('/:id/content', async (req, res) => {
    try {
        const db = await require('../database');
        const { content_id } = req.body;
        const folder_id = req.params.id;

        if (!content_id) {
            return res.status(400).json({ error: 'content_id is required' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO folder_content (id, folder_id, content_id, created_at)
            VALUES (?, ?, ?, ?)
        `).run(id, folder_id, content_id, now);

        res.json({ id, folder_id, content_id, created_at: now });
    } catch (error) {
        console.error('Error adding content to folder:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/folders/:id/content/:contentId - Remove content from folder
router.delete('/:id/content/:contentId', async (req, res) => {
    try {
        const db = await require('../database');
        const { id: folder_id, contentId: content_id } = req.params;

        db.prepare(`
            DELETE FROM folder_content 
            WHERE folder_id = ? AND content_id = ?
        `).run(folder_id, content_id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing content from folder:', error);
        res.status(500).json({ error: error.message });
    }
});


// PUT /api/folders/:id - Update folder
router.put('/:id', async (req, res) => {
    try {
        const db = await require('../database');
        const { name, parent_id } = req.body;
        const now = new Date().toISOString();

        db.prepare(`
            UPDATE folders 
            SET name = ?, parent_id = ?, updated_at = ?
            WHERE id = ?
        `).run(name, parent_id, now, req.params.id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/folders/:id/move - Move folder to new parent
router.put('/:id/move', async (req, res) => {
    try {
        const db = await require('../database');
        const { parent_id } = req.body;
        const now = new Date().toISOString();

        db.prepare(`
            UPDATE folders 
            SET parent_id = ?, updated_at = ?
            WHERE id = ?
        `).run(parent_id, now, req.params.id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error moving folder:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/folders/:id - Delete folder
router.delete('/:id', requireOwner, async (req, res) => {
    try {
        const db = await require('../database');
        const orgId = req.user.effective_organization_id;

        // Get folder to check ownership and system status
        let folder;
        if (req.user.role === 'ODSAdmin' && !req.user.view_as) {
            folder = db.prepare('SELECT is_system FROM folders WHERE id = ?').get(req.params.id);
        } else {
            folder = db.prepare('SELECT is_system FROM folders WHERE id = ? AND org_id = ?').get(req.params.id, orgId);
        }

        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        if (folder.is_system === 1) {
            return res.status(403).json({ error: 'Cannot delete system folder' });
        }

        db.prepare('DELETE FROM folders WHERE id = ?').run(req.params.id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
