const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { requireWriteAccess, requireOwner } = require('../middleware/auth');

// GET /api/playlists - List all playlists
router.get('/', async (req, res) => {
    try {
        const db = await require('../database');
        const orgId = req.user.effective_organization_id;

        let playlists;
        if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
            playlists = db.prepare('SELECT * FROM playlists_v2 ORDER BY name ASC').all();
        } else {
            playlists = db.prepare('SELECT * FROM playlists_v2 WHERE org_id = ? ORDER BY name ASC').all(orgId);
        }

        res.json(playlists);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/playlists/:id - Get playlist details
router.get('/:id', async (req, res) => {
    try {
        const db = await require('../database');
        const orgId = req.user.effective_organization_id;

        let playlist;
        if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
            playlist = db.prepare('SELECT * FROM playlists_v2 WHERE id = ?').get(req.params.id);
        } else {
            playlist = db.prepare('SELECT * FROM playlists_v2 WHERE id = ? AND org_id = ?').get(req.params.id, orgId);
        }

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        res.json(playlist);
    } catch (error) {
        console.error('Error fetching playlist:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/playlists/:id/content - Get playlist content with display order
router.get('/:id/content', async (req, res) => {
    try {
        const db = await require('../database');

        const content = db.prepare(`
            SELECT c.*, pc.display_order, pc.id as assignment_id
            FROM content c
            JOIN playlist_content pc ON c.id = pc.content_id
            WHERE pc.playlist_id = ?
            ORDER BY pc.display_order ASC
        `).all(req.params.id);

        // Parse JSON fields
        const parsed = content.map(item => ({
            ...item,
            metadata: JSON.parse(item.metadata || '{}')
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Error fetching playlist content:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/playlists - Create new playlist
router.post('/', requireWriteAccess, async (req, res) => {
    try {
        const db = await require('../database');
        const { name, description, created_by } = req.body;
        const orgId = req.user.effective_organization_id;

        if (!name) {
            return res.status(400).json({ error: 'Playlist name is required' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO playlists_v2 (id, name, description, org_id, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, description || null, orgId, created_by || req.user.email, now, now);

        res.json({ id, name, description, org_id: orgId, created_by: created_by || req.user.email, created_at: now, updated_at: now });
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/playlists/:id/content - Add content to playlist
router.post('/:id/content', async (req, res) => {
    try {
        const db = await require('../database');
        const { content_id, display_order } = req.body;
        const playlist_id = req.params.id;

        if (!content_id) {
            return res.status(400).json({ error: 'content_id is required' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        // Get next display_order if not provided
        let nextOrder = display_order;
        if (nextOrder === undefined) {
            const result = db.prepare(`
                SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
                FROM playlist_content WHERE playlist_id = ?
            `).get(playlist_id);
            nextOrder = result.next_order;
        }

        db.prepare(`
            INSERT INTO playlist_content (id, playlist_id, content_id, display_order, created_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, playlist_id, content_id, nextOrder, now);

        res.json({ id, playlist_id, content_id, display_order: nextOrder, created_at: now });
    } catch (error) {
        console.error('Error adding content to playlist:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/playlists/:id - Update playlist
router.put('/:id', requireWriteAccess, async (req, res) => {
    try {
        const db = await require('../database');
        const { name, description } = req.body;
        const now = new Date().toISOString();
        const orgId = req.user.effective_organization_id;

        // Verify ownership
        let playlist;
        if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
            playlist = db.prepare('SELECT * FROM playlists_v2 WHERE id = ?').get(req.params.id);
        } else {
            playlist = db.prepare('SELECT * FROM playlists_v2 WHERE id = ? AND org_id = ?').get(req.params.id, orgId);
        }

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        db.prepare(`
            UPDATE playlists_v2 
            SET name = ?, description = ?, updated_at = ?
            WHERE id = ?
        `).run(name, description, now, req.params.id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating playlist:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/playlists/:id/content/:contentId/order - Update display order
router.put('/:id/content/:contentId/order', async (req, res) => {
    try {
        const db = await require('../database');
        const { display_order } = req.body;

        if (display_order === undefined) {
            return res.status(400).json({ error: 'display_order is required' });
        }

        db.prepare(`
            UPDATE playlist_content 
            SET display_order = ?
            WHERE playlist_id = ? AND content_id = ?
        `).run(display_order, req.params.id, req.params.contentId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating display order:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/playlists/:id - Delete playlist
router.delete('/:id', requireOwner, async (req, res) => {
    try {
        const db = await require('../database');
        const orgId = req.user.effective_organization_id;

        // Verify ownership
        let playlist;
        if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
            playlist = db.prepare('SELECT * FROM playlists_v2 WHERE id = ?').get(req.params.id);
        } else {
            playlist = db.prepare('SELECT * FROM playlists_v2 WHERE id = ? AND org_id = ?').get(req.params.id, orgId);
        }

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        db.prepare('DELETE FROM playlists_v2 WHERE id = ?').run(req.params.id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting playlist:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/playlists/:id/content/:contentId - Remove content from playlist
router.delete('/:id/content/:contentId', async (req, res) => {
    try {
        const db = await require('../database');

        db.prepare(`
            DELETE FROM playlist_content 
            WHERE playlist_id = ? AND content_id = ?
        `).run(req.params.id, req.params.contentId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing content from playlist:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ASSET DIRECTORY ROUTES
// ============================================

// GET /api/playlists/:id/assets - Get Asset Directory for playlist
router.get('/:id/assets', async (req, res) => {
    try {
        const db = await require('../database');

        const assets = db.prepare(`
            SELECT c.*, pa.added_at, pa.id as asset_id
            FROM content c
            JOIN playlist_assets pa ON c.id = pa.content_id
            WHERE pa.playlist_id = ?
            ORDER BY pa.added_at DESC
        `).all(req.params.id);

        // Parse JSON fields
        const parsed = assets.map(item => ({
            ...item,
            metadata: JSON.parse(item.metadata || '{}')
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Error fetching playlist assets:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/playlists/:id/assets - Add content to Asset Directory (supports multi-select)
router.post('/:id/assets', async (req, res) => {
    try {
        const db = await require('../database');
        const { content_ids } = req.body; // Array of content IDs
        const playlist_id = req.params.id;

        if (!content_ids || !Array.isArray(content_ids) || content_ids.length === 0) {
            return res.status(400).json({ error: 'content_ids array is required' });
        }

        const now = new Date().toISOString();
        const added = [];

        for (const content_id of content_ids) {
            try {
                const id = uuidv4();
                db.prepare(`
                    INSERT INTO playlist_assets (id, playlist_id, content_id, added_at)
                    VALUES (?, ?, ?, ?)
                `).run(id, playlist_id, content_id, now);

                added.push({ id, playlist_id, content_id, added_at: now });
            } catch (err) {
                // Skip if already exists (UNIQUE constraint violation)
                if (!err.message.includes('UNIQUE')) {
                    throw err;
                }
            }
        }

        res.json({ added, count: added.length });
    } catch (error) {
        console.error('Error adding assets to playlist:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/playlists/:id/assets/:contentId - Remove content from Asset Directory
router.delete('/:id/assets/:contentId', async (req, res) => {
    try {
        const db = await require('../database');

        // Remove from Asset Directory
        db.prepare(`
            DELETE FROM playlist_assets 
            WHERE playlist_id = ? AND content_id = ?
        `).run(req.params.id, req.params.contentId);

        // Also remove from Playlist Content if it exists
        db.prepare(`
            DELETE FROM playlist_content 
            WHERE playlist_id = ? AND content_id = ?
        `).run(req.params.id, req.params.contentId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing asset from playlist:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
